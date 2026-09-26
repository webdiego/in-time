"use client";

import { useState } from "react";
import { ArrowDownIcon } from "lucide-react";
import { HeroBackground } from "@/components/hero-background";
import { ProfileForm } from "@/components/profile-form";
import type { Profile } from "@/lib/profile";

// UN World Population Prospects 2024: roughly 61–62 million deaths a year worldwide.
const DEATHS_PER_SECOND = 61.7e6 / (365.2425 * 24 * 3600);

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

        <div className="relative z-10 flex flex-col gap-10 px-6 py-20 sm:px-12 lg:px-16 xl:px-24">
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
              invisible, but it&apos;s running all the same. We estimate it from today&apos;s mortality data for your
              age, country and sex.
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
      </section>

      <section id="profile" className="relative flex scroll-mt-4 flex-col items-center px-6 py-20 sm:px-12">
        <ProfileForm now={now} initial={initial} onDone={onDone} />
      </section>
    </div>
  );
}
