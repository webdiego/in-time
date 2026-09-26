"use client";

import { useState } from "react";
import { ArrowDownIcon } from "lucide-react";
import { HeroBackground } from "@/components/hero-background";
import { ProfileForm } from "@/components/profile-form";
import type { Profile } from "@/lib/profile";

// UN World Population Prospects 2024: roughly 61–62 million deaths a year worldwide.
const DEATHS_PER_SECOND = 61.7e6 / (365.2425 * 24 * 3600);

// Backed by this app's own numbers, not fabricated: see life-expectancy.json (Nigeria
// vs. Hong Kong, among countries of 1M+ people), lib/lifestyle.ts's hazard ratios, and
// the sleep/work share of a typical week in the results' time breakdown.
const FACTS = [
  { k: "01", v: "Where you're born can swing your life expectancy by more than 30 years." },
  { k: "02", v: "Smoking, diet, sleep and activity together can shift your estimate by a decade or more." },
  { k: "03", v: "For most people, sleep and work alone claim over half of what's left." },
];

/** Home: hero fills the first viewport, the form follows below it at full width. */
export function Landing({ now, initial, onDone }: { now: number; initial?: Profile | null; onDone?: () => void }) {
  const [openedAt] = useState(now);
  const stopped = Math.floor(((now - openedAt) / 1000) * DEATHS_PER_SECOND);

  return (
    <div className="relative flex w-full flex-1 flex-col">
      <div className="hud-grid pointer-events-none absolute inset-0" aria-hidden />

      <section
        aria-labelledby="hero-title"
        className="relative flex min-h-svh flex-col justify-center overflow-hidden"
      >
        <div className="absolute inset-0">
          <HeroBackground />
        </div>
        {/* Scrim: the animated background is decoration, the text has to win. */}
        <div className="absolute inset-0 bg-background/70" aria-hidden />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-16 px-6 py-20 sm:px-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:px-16 xl:px-24">
          <div className="flex flex-col gap-10">
            <p className="hud-tag">Life-clock · online</p>

            <div className="flex flex-col gap-6">
              <h1 id="hero-title" className="digits text-6xl! sm:text-7xl! xl:text-8xl!">
                IN TIME
              </h1>
              <p className="max-w-xl text-2xl leading-snug font-medium text-balance sm:text-3xl">
                Your clock started the day you were born. Find out how much time is left on it.
              </p>
              <p className="max-w-md leading-relaxed text-muted-foreground">
                In the film, time is the only currency and everyone can read what&apos;s left on their arm. Yours is
                invisible, but it&apos;s running all the same. We estimate it from today&apos;s mortality data for
                your age, country and sex.
              </p>
            </div>

            <p className="max-w-md font-mono text-xs text-muted-foreground">
              While you&apos;ve been reading this, about{" "}
              <span className="text-foreground tabular-nums" aria-live="off">
                {stopped}
              </span>{" "}
              {stopped === 1 ? "life" : "lives"} ended somewhere in the world.
            </p>

            <a
              href="#profile"
              className="scroll-cue inline-flex items-center gap-2 self-start font-mono text-sm tracking-widest text-muted-foreground uppercase hover:text-foreground"
            >
              Start
              <ArrowDownIcon className="size-4" aria-hidden />
            </a>
          </div>

          <ul className="hud-frame flex flex-col divide-y divide-border">
            {FACTS.map((f) => (
              <li key={f.k} className="flex gap-4 p-5">
                <span className="step-index shrink-0 font-mono text-sm">{f.k}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{f.v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="profile" className="relative flex scroll-mt-4 flex-col items-center px-6 py-20 sm:px-12">
        <ProfileForm now={now} initial={initial} onDone={onDone} />
      </section>
    </div>
  );
}
