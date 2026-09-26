"use client";

import { Button } from "@/components/ui/button";
import { fmtYears } from "@/lib/format";
import type { TimeBudget } from "@/lib/time-budget";

/** Part-to-whole of the remaining lifetime: free time is the emphasised slice, sleep and work are context. */
export function TimeBreakdown({
  budget,
  age,
  hasWork,
  onEdit,
}: {
  budget: TimeBudget;
  age: number;
  hasWork: boolean;
  onEdit: () => void;
}) {
  const retired = age >= budget.retirementAge;
  const segments = [
    {
      id: "free",
      label: hasWork ? "Free" : "Awake",
      years: budget.free,
      color: "var(--glow)",
      detail: hasWork ? "awake and not working" : "work not counted",
    },
    {
      id: "sleep",
      label: "Sleep",
      years: budget.sleep,
      color: "var(--seg-sleep)",
      detail: `${budget.sleepHours} h a night`,
    },
    ...(hasWork
      ? [
          {
            id: "work",
            label: "Work",
            years: budget.work,
            color: "var(--seg-work)",
            detail: retired
              ? "already past retirement"
              : `${budget.workHoursPerWeek} h a week until ${budget.retirementAge}`,
          },
        ]
      : []),
  ];

  return (
    <figure className="flex w-full max-w-xl flex-col gap-4">
      <figcaption className="flex flex-col gap-1">
        <h2 className="text-base font-medium text-foreground">
          Where your remaining time goes
        </h2>
        <p className="text-sm text-muted-foreground">
          Of {fmtYears(budget.total)} years left, about{" "}
          <strong className="font-medium text-foreground">
            {fmtYears(budget.free)}
          </strong>{" "}
          {hasWork ? "are yours to spend" : "you'll spend awake"}.
        </p>
      </figcaption>

      {/* 2px surface gaps separate the segments instead of outlines. */}
      <div className="flex h-3 w-full gap-0.5" aria-hidden>
        {segments
          .filter((s) => s.years > 0)
          .map((s) => (
            <div
              key={s.id}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(s.years / budget.total) * 100}%`,
                background: s.color,
              }}
            />
          ))}
      </div>

      <dl className="flex flex-col divide-y divide-border">
        {segments.map((s) => (
          <div
            key={s.id}
            className="flex items-baseline justify-between gap-4 py-2.5"
          >
            <dt className="flex items-baseline gap-2.5">
              <span
                className="inline-block size-2.5 translate-y-px rounded-sm"
                style={{ background: s.color }}
                aria-hidden
              />
              <span className="flex flex-col">
                <span className="text-sm text-foreground">{s.label}</span>
                <span className="text-[11px] text-muted-foreground">
                  {s.detail}
                </span>
              </span>
            </dt>
            <dd className="font-mono text-sm text-foreground tabular-nums">
              {fmtYears(s.years)} years
              <span className="ml-2 text-muted-foreground">
                {Math.round((s.years / budget.total) * 100)}%
              </span>
            </dd>
          </div>
        ))}
      </dl>

      {!hasWork && (
        <Button
          variant="link"
          onClick={onEdit}
          className="self-start px-0 text-muted-foreground"
        >
          Add your work hours to see your free time
        </Button>
      )}
    </figure>
  );
}
