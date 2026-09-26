/*
 * Splits the remaining lifetime into sleep, work and free time. Sleep takes
 * the same share of every day for the rest of your life; work only runs until
 * retirement. Everything is an average over the years, not a schedule.
 */

export const DEFAULT_SLEEP_HOURS = 8;
export const DEFAULT_RETIREMENT_AGE = 67;
const HOURS_PER_WEEK = 7 * 24;

export type TimeBudgetInput = {
  /** Remaining life expectancy, in years. */
  remaining: number;
  age: number;
  sleepHours?: number;
  workHoursPerWeek?: number;
  retirementAge?: number;
};

export type TimeBudget = {
  total: number;
  sleep: number;
  work: number;
  /** Total minus sleep. */
  awake: number;
  /** Total minus sleep and work. */
  free: number;
  /** How fast each balance drains right now, as a fraction of real time. */
  rate: { total: number; awake: number; free: number };
  sleepHours: number;
  workHoursPerWeek: number;
  retirementAge: number;
};

export function timeBudget({
  remaining,
  age,
  sleepHours = DEFAULT_SLEEP_HOURS,
  workHoursPerWeek = 0,
  retirementAge = DEFAULT_RETIREMENT_AGE,
}: TimeBudgetInput): TimeBudget {
  const sleepShare = sleepHours / 24;
  const workShare = workHoursPerWeek / HOURS_PER_WEEK;
  const workingYearsLeft = Math.max(0, Math.min(retirementAge - age, remaining));
  const sleep = remaining * sleepShare;
  const work = workingYearsLeft * workShare;
  const stillWorking = age < retirementAge && workHoursPerWeek > 0;
  return {
    total: remaining,
    sleep,
    work,
    awake: remaining - sleep,
    free: remaining - sleep - work,
    rate: {
      total: 1,
      awake: 1 - sleepShare,
      free: 1 - sleepShare - (stillWorking ? workShare : 0),
    },
    sleepHours,
    workHoursPerWeek,
    retirementAge,
  };
}

/** Sleep plus work can't exceed the hours in a week. */
export function weekFits(sleepHours: number, workHoursPerWeek: number): boolean {
  return sleepHours * 7 + workHoursPerWeek <= HOURS_PER_WEEK;
}
