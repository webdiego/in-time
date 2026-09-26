import data from "./life-expectancy.json";

export type Sex = "male" | "female";

export type CountryStats = {
  code: string;
  male: number;
  female: number;
  total: number;
  year: number;
  population: number;
  /** WHO life table: probability of dying within each age group (0, 1-4, 5-9, …, 80-84). */
  qx?: Record<Sex, number[]>;
};

export const countries: CountryStats[] = data.countries;
export const world: CountryStats = { code: "WORLD", population: Infinity, ...data.world };
export const dataSource = data.source;
export const dataYear = data.world.year;

/**
 * Below this, a "country" is really a city-state, tax haven, or dependent
 * territory whose life-expectancy figure is skewed by an unusual resident
 * population (e.g. Monaco's wealthy retirees). Used to keep the "most
 * longevous place" comparison to entities of comparable, city-or-bigger scale.
 */
const NOTABLE_POPULATION = 1_000_000;

export const notableCountries: CountryStats[] = countries.filter((c) => c.population >= NOTABLE_POPULATION);

export const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000;

const STEP = 0.1;
const MAX_AGE = 120;
const GRID = Math.round(MAX_AGE / STEP);
const AGE_GROUP_STARTS = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85];
// Beyond the last WHO group mortality keeps rising roughly exponentially.
const OLD_AGE_GROWTH = 0.1;

type Hazard = Float64Array;

/*
 * Mortality is represented as a hazard (instantaneous death rate) on a fine
 * age grid. When the WHO life table is available we derive it from there,
 * otherwise we fall back to a Gompertz-Makeham curve whose shape depends on e0.
 * Either way the curve is then scaled so that life expectancy at birth matches
 * the latest World Bank / UN figure: the WHO tables give the age profile, the
 * UN figure gives the current level.
 */
function hazardFromTable(qx: number[]): Hazard {
  const rates = qx.map((q, i) => {
    const width = AGE_GROUP_STARTS[i + 1] - AGE_GROUP_STARTS[i];
    return -Math.log(1 - Math.min(q, 0.999)) / width;
  });
  const last = rates[rates.length - 1];
  const h = new Float64Array(GRID);
  let group = 0;
  for (let i = 0; i < GRID; i++) {
    const x = (i + 0.5) * STEP;
    if (x >= 85) {
      h[i] = last * Math.exp(OLD_AGE_GROWTH * (x - 82.5));
      continue;
    }
    while (x >= AGE_GROUP_STARTS[group + 1]) group++;
    h[i] = rates[group];
  }
  return h;
}

function hazardFromModel(e0: number): Hazard {
  const gap = Math.max(0, 84 - e0);
  const child = 0.0035 * gap;
  const makeham = 0.0002 + 0.00012 * gap;
  const gamma = 0.075 + 0.0012 * (e0 - 55);
  const h = new Float64Array(GRID);
  for (let i = 0; i < GRID; i++) {
    const x = (i + 0.5) * STEP;
    h[i] = child * Math.exp(-x) + makeham + 1e-5 * Math.exp(gamma * x);
  }
  return h;
}

/** Remaining life expectancy at `age`, with hazards multiplied by `scale` and by `personal(x)` from `age` on. */
function expectancy(h: Hazard, age: number, scale: number, personal?: (x: number) => number): number {
  const start = Math.min(age / STEP, GRID - 1);
  let i = Math.floor(start);
  let survival = 1;
  let area = 0;
  // Partial first step, so the result is continuous in age.
  let dt = (i + 1 - start) * STEP;
  while (i < GRID && survival > 1e-9) {
    const x = (i + 0.5) * STEP;
    const mu = h[i] * scale * (personal ? personal(x) : 1);
    const next = survival * Math.exp(-mu * dt);
    area += ((survival + next) / 2) * dt;
    survival = next;
    i++;
    dt = STEP;
  }
  return area;
}

type Calibrated = { h: Hazard; scale: number };
const cache = new Map<string, Calibrated>();

function calibrated(country: CountryStats, sex: Sex): Calibrated {
  const key = `${country.code}:${sex}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const e0 = country[sex];
  const qx = country.qx?.[sex];
  const h = qx ? hazardFromTable(qx) : hazardFromModel(e0);
  let lo = 0.05;
  let hi = 20;
  for (let k = 0; k < 50; k++) {
    const mid = Math.sqrt(lo * hi);
    if (expectancy(h, 0, mid) > e0) lo = mid;
    else hi = mid;
  }
  const result = { h, scale: Math.sqrt(lo * hi) };
  cache.set(key, result);
  return result;
}

/**
 * Relative risks from cohort studies are measured mostly in middle age and
 * shrink in the very old, so the personal multiplier fades towards half its
 * effect between 70 and 90.
 */
function attenuated(hazardRatio: number) {
  if (hazardRatio === 1) return undefined;
  return (x: number) => {
    const w = x <= 70 ? 1 : x >= 90 ? 0.5 : 1 - (0.5 * (x - 70)) / 20;
    return 1 + (hazardRatio - 1) * w;
  };
}

/**
 * Probability of still being alive at each whole age from `age` up to `until`,
 * given survival to `age`. Used for the survival chart.
 */
export function survivalCurve(
  country: CountryStats,
  sex: Sex,
  age: number,
  hazardRatio = 1,
  until = 105,
): { age: number; alive: number }[] {
  const { h, scale } = calibrated(country, sex);
  const personal = attenuated(hazardRatio);
  const stepsPerYear = Math.round(1 / STEP);
  const start = Math.min(age / STEP, GRID - 1);
  const end = Math.min(until * stepsPerYear, GRID);
  const points = [{ age: Math.floor(age), alive: 1 }];
  let survival = 1;
  // Integer grid indices only: step i covers [i, i+1) * STEP, the first one partially.
  for (let i = Math.floor(start); i < end; i++) {
    const dt = (i === Math.floor(start) ? i + 1 - start : 1) * STEP;
    const x = (i + 0.5) * STEP;
    survival *= Math.exp(-h[i] * scale * (personal ? personal(x) : 1) * dt);
    if ((i + 1) % stepsPerYear === 0) points.push({ age: (i + 1) / stepsPerYear, alive: survival });
  }
  return points;
}

/** First whole age at which the survival probability drops below `p`. */
export function ageAtSurvival(curve: { age: number; alive: number }[], p: number): number | null {
  return curve.find((point) => point.alive < p)?.age ?? null;
}

/** Expected remaining years at `age`, optionally with a personal hazard ratio versus the population average. */
export function remainingYears(country: CountryStats, sex: Sex, age: number, hazardRatio = 1): number {
  const { h, scale } = calibrated(country, sex);
  return expectancy(h, Math.max(age, 0), scale, attenuated(hazardRatio));
}

export function hasWhoTable(country: CountryStats): boolean {
  return Boolean(country.qx);
}

export function findCountry(code: string): CountryStats | undefined {
  return countries.find((c) => c.code === code);
}

export function ageInYears(birthDate: Date, now: number): number {
  return (now - birthDate.getTime()) / YEAR_MS;
}
