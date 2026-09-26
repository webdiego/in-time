"use client";

import { useMemo, useState } from "react";
import { ShareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TimeBreakdown } from "@/components/time-breakdown";
import { CountryChart, SurvivalChart } from "@/components/life-charts";
import {
  YEAR_MS,
  ageInYears,
  notableCountries,
  dataSource,
  dataYear,
  findCountry,
  hasWhoTable,
  remainingYears,
  world,
} from "@/lib/lifespan";
import { combinedHr, factorHr, factors } from "@/lib/lifestyle";
import {
  countryName,
  fmtSignedYears,
  fmtYears,
  pad,
  splitDuration,
} from "@/lib/format";
import { renderShareCard, shareOrDownload } from "@/lib/share-card";
import type { Profile } from "@/lib/profile";
import { timeBudget } from "@/lib/time-budget";

const DAY_MS = 86_400_000;

type Mode = "total" | "awake" | "free";
const MODES: {
  id: Mode;
  label: string;
  heading: string;
  shareHeading: string;
}[] = [
  {
    id: "total",
    label: "Total",
    heading: "time left",
    shareHeading: "The time I have left",
  },
  {
    id: "awake",
    label: "Awake",
    heading: "waking time left",
    shareHeading: "My waking time left",
  },
  {
    id: "free",
    label: "Free",
    heading: "free time left",
    shareHeading: "My free time left",
  },
];

export function LifeClock({
  profile,
  now,
  onEdit,
}: {
  profile: Profile;
  now: number;
  onEdit: () => void;
}) {
  const country = findCountry(profile.country)!;
  const { sex } = profile;
  const birth = useMemo(
    () => new Date(`${profile.birthDate}T00:00:00`),
    [profile.birthDate],
  );

  // Recompute once a day: remaining expectancy shifts as you age.
  const day = Math.floor(now / DAY_MS);
  const estimate = useMemo(() => {
    const at = day * DAY_MS;
    const age = ageInYears(birth, at);
    // BMI bands only make sense for adults.
    const lifestyle =
      age >= 18 ? profile.lifestyle : { ...profile.lifestyle, bmi: undefined };
    const average = remainingYears(country, sex, age);
    const hr = combinedHr(lifestyle);
    const personal = remainingYears(country, sex, age, hr);
    const best = notableCountries.reduce((a, b) => (b[sex] > a[sex] ? b : a));
    const byFactor = factors
      .filter((f) => lifestyle[f.id])
      .map((f) => ({
        title: f.title,
        source: f.source,
        delta:
          remainingYears(country, sex, age, factorHr(f.id, lifestyle)) -
          average,
      }));
    const budget = timeBudget({
      remaining: personal,
      age,
      sleepHours: profile.sleepHours,
      workHoursPerWeek: profile.workHoursPerWeek,
      retirementAge: profile.retirementAge,
    });
    return {
      at,
      budget,
      age,
      hr,
      average,
      personal,
      deadline: at + personal * YEAR_MS,
      vsWorld: average - remainingYears(world, sex, age),
      best,
      vsBest: remainingYears(best, sex, age) - average,
      byFactor,
    };
  }, [
    birth,
    country,
    sex,
    profile.lifestyle,
    profile.sleepHours,
    profile.workHoursPerWeek,
    profile.retirementAge,
    day,
  ]);

  // Only offer the views the user gave us data for: awake needs sleep, free needs sleep and work.
  const hasSleep = profile.sleepHours !== undefined;
  const hasWork = (profile.workHoursPerWeek ?? 0) > 0;
  const available = MODES.filter(
    (m) => m.id === "total" || (hasSleep && (m.id === "awake" || hasWork)),
  );
  const [chosenMode, setMode] = useState<Mode>("total");
  // Falls back to total if the chosen view stops being available after an edit.
  const mode = available.some((m) => m.id === chosenMode)
    ? chosenMode
    : "total";
  const modeInfo = MODES.find((m) => m.id === mode)!;
  const { budget } = estimate;
  // Each balance drains at its own average rate: free time only runs out while you're awake and not working.
  const left = budget[mode] * YEAR_MS - (now - estimate.at) * budget.rate[mode];
  const t = splitDuration(left);
  const lived = ageInYears(birth, now);
  const totalLeft = estimate.deadline - now;
  const usedPct = Math.min(100, (lived / (lived + totalLeft / YEAR_MS)) * 100);
  const deadlineLabel = new Date(estimate.deadline).toLocaleDateString("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const personalised = estimate.byFactor.length > 0;
  const lifestyleDelta = estimate.personal - estimate.average;

  const [sharing, setSharing] = useState<"idle" | "busy" | "downloaded">(
    "idle",
  );
  async function share() {
    setSharing("busy");
    try {
      const blob = await renderShareCard({
        time: t,
        usedPct,
        heading: modeInfo.shareHeading,
        subtitle: `${countryName(country.code)} · ${sex === "male" ? "man" : "woman"} · ${Math.floor(lived)} years`,
      });
      setSharing(
        (await shareOrDownload(blob)) === "downloaded" ? "downloaded" : "idle",
      );
    } catch {
      setSharing("idle");
    }
  }

  return (
    <section className="flex w-full flex-col items-center gap-14">
      <div className="flex flex-col items-center gap-4">
        <span className="label">{`${personalised || mode !== "total" ? "Your " : ""}${modeInfo.heading}`}</span>
        {available.length > 1 && (
          <ToggleGroup
            value={[mode]}
            onValueChange={(v) => v[0] && setMode(v[0] as Mode)}
            aria-label="Which time to count"
            className="rounded-full border border-border bg-card p-1"
          >
            {available.map((m) => (
              <ToggleGroupItem
                key={m.id}
                value={m.id}
                className="h-8 rounded-full px-4 font-mono text-xs tracking-[0.14em] uppercase aria-pressed:bg-glow aria-pressed:text-primary-foreground dark:aria-pressed:bg-secondary dark:aria-pressed:text-glow"
              >
                {m.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
        <div
          className="flex items-start gap-1 sm:gap-3"
          role="timer"
          aria-label={`${t.years} years, ${t.days} days, ${t.hours} hours and ${t.minutes} minutes of ${modeInfo.heading}`}
        >
          <Unit value={pad(t.years, 2)} label="years" />
          <Sep />
          <Unit value={pad(t.days, 3)} label="days" />
          <Sep />
          <Unit value={pad(t.hours, 2)} label="hours" />
          <Sep />
          <Unit value={pad(t.minutes, 2)} label="min" />
          <Sep />
          <Unit value={pad(t.seconds, 2)} label="sec" />
        </div>
        {mode !== "total" && (
          <p className="max-w-md text-center font-mono text-xs text-muted-foreground">
            Drains at {Math.round(budget.rate[mode] * 100)}% of real time: one
            second here every {(1 / budget.rate[mode]).toFixed(1)} s, on
            average.
          </p>
        )}
      </div>

      <div className="w-full max-w-xl">
        <div className="mb-2 flex justify-between font-mono text-xs text-muted-foreground">
          <span>birth</span>
          <span>{usedPct.toFixed(1)}% already spent</span>
          <span>~{deadlineLabel}</span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-label="Portion of life already lived"
          aria-valuenow={Math.round(usedPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-glow life-bar-fill"
            style={{ width: `${usedPct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button
          onClick={share}
          disabled={sharing === "busy"}
          className="cta h-12 rounded-full"
        >
          <ShareIcon aria-hidden />
          {sharing === "busy" ? "Preparing the image…" : "Share your clock"}
        </Button>
        <p className="sr-only" aria-live="polite">
          {sharing === "downloaded" ? "Image downloaded." : ""}
        </p>
      </div>

      <dl className="grid w-full max-w-xl gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        <Stat label="You've lived" value={`${fmtYears(lived)} years`} />
        <Stat
          label={`Average ${sex === "male" ? "men" : "women"}, ${countryName(country.code)}`}
          value={`${fmtYears(country[sex])} years`}
          hint="life expectancy at birth"
        />
        <Stat
          label="Compared to the world"
          value={`${fmtSignedYears(estimate.vsWorld)} years`}
          hint="at the same age"
        />
      </dl>

      {hasSleep ? (
        <TimeBreakdown
          budget={budget}
          age={estimate.age}
          hasWork={hasWork}
          onEdit={onEdit}
        />
      ) : (
        <Button
          variant="link"
          onClick={onEdit}
          className="text-muted-foreground"
        >
          Add your sleep and work hours to see how much of this time is really
          free
        </Button>
      )}

      {personalised && (
        <div className="w-full max-w-xl rounded-xl border border-border bg-card p-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm text-muted-foreground">Your lifestyle</h2>
            <p
              className={`font-mono text-xl ${lifestyleDelta >= 0 ? "text-glow" : "text-destructive"}`}
            >
              {fmtSignedYears(lifestyleDelta)} years
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            compared to your country&apos;s average (
            {fmtYears(estimate.average)} years left)
          </p>
          <ul className="mt-4 flex flex-col divide-y divide-border">
            {estimate.byFactor.map((f) => (
              <li
                key={f.title}
                className="flex items-baseline justify-between gap-4 py-2.5"
              >
                <span className="flex flex-col">
                  <span className="text-sm">{f.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {f.source}
                  </span>
                </span>
                <span
                  className={`font-mono tabular-nums ${f.delta >= 0 ? "text-glow" : "text-destructive"}`}
                >
                  {fmtSignedYears(f.delta)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">
            These factors are correlated with each other, so the total
            isn&apos;t a simple sum.
          </p>
        </div>
      )}

      <div className="flex w-full max-w-xl flex-col gap-12">
        <SurvivalChart
          country={country}
          sex={sex}
          age={estimate.age}
          hazardRatio={estimate.hr}
        />
        <CountryChart country={country} sex={sex} age={estimate.age} />
      </div>

      {estimate.vsBest > 0.5 && (
        <p className="max-w-xl text-center text-balance text-muted-foreground">
          In the longest-living place in the world (
          {countryName(estimate.best.code)}) you&apos;d have{" "}
          <span className="text-glow">
            {fmtYears(estimate.vsBest)} more years
          </span>{" "}
          on average. Time isn&apos;t distributed equally. Just like in the
          film.
        </p>
      )}

      <div className="flex flex-col items-center gap-6">
        <Button
          variant="link"
          onClick={onEdit}
          className="text-muted-foreground"
        >
          {personalised
            ? "Edit your details"
            : "Make the estimate personal: add your lifestyle"}
        </Button>
        <p className="max-w-lg text-center text-xs leading-relaxed text-muted-foreground">
          Statistical estimate, not a prediction. Life expectancy by country and
          sex: {dataSource} ({dataYear}).
          {hasWhoTable(country)
            ? " Age-specific mortality comes from WHO life tables (Global Health Estimates 2019, pre-COVID), recalibrated to the latest figures."
            : " There are no WHO tables for this country: age-specific mortality is estimated with a model."}{" "}
          It calculates how many years remain on average for someone who has
          already reached your age. Health, genetics and luck matter more than
          any average.
        </p>
      </div>
    </section>
  );
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2" aria-hidden>
      <span className="digits">{value}</span>
      <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  );
}

function Sep() {
  return (
    <span className="digits opacity-40" aria-hidden>
      :
    </span>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-background p-5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-xl text-foreground tabular-nums">
        {value}
      </dd>
      {hint && <dd className="text-[11px] text-muted-foreground">{hint}</dd>}
    </div>
  );
}
