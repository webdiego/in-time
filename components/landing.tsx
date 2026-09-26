"use client";

import { useState } from "react";
import { ArrowDownIcon } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { YEAR_MS, world } from "@/lib/lifespan";
import { pad, splitDuration } from "@/lib/format";
import type { Profile } from "@/lib/profile";

// UN World Population Prospects 2024: roughly 61–62 million deaths a year worldwide.
const DEATHS_PER_SECOND = 61.7e6 / (365.2425 * 24 * 3600);

/**
 * Home: hero on the left (sticky on desktop), form on the right. On small
 * screens the hero fills the first viewport and the form follows on scroll.
 */
export function Landing({ now, initial, onDone }: { now: number; initial?: Profile | null; onDone?: () => void }) {
  // The demo clock starts from a full average lifespan the moment the page opens.
  const [openedAt] = useState(now);
  const elapsed = now - openedAt;
  const t = splitDuration(world.total * YEAR_MS - elapsed);
  const stopped = Math.floor((elapsed / 1000) * DEATHS_PER_SECOND);

  return (
    <div className="relative grid w-full flex-1 lg:grid-cols-[1.15fr_1fr]">
      <div className="hud-grid pointer-events-none absolute inset-0" aria-hidden />

      <section
        aria-labelledby="hero-title"
        className="relative flex min-h-svh flex-col justify-center gap-10 px-6 py-20 sm:px-12 lg:sticky lg:top-0 lg:h-svh lg:px-16 xl:px-24"
      >
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

        <figure className="hud-frame flex max-w-md flex-col gap-4 p-5">
          <figcaption className="label">Average human lifespan · world</figcaption>
          <div
            className="flex items-baseline gap-1.5 font-mono"
            role="img"
            aria-label={`Average lifespan worldwide: ${world.total} years`}
          >
            {[pad(t.years, 2), pad(t.days, 3), pad(t.hours, 2), pad(t.minutes, 2), pad(t.seconds, 2)].map((v, i) => (
              <span key={i} className="flex items-baseline gap-1.5">
                {i > 0 && <span className="digits text-2xl! opacity-40 sm:text-3xl!">:</span>}
                <span className="digits text-3xl! sm:text-4xl!">{v}</span>
              </span>
            ))}
          </div>
          <p className="font-mono text-xs text-muted-foreground" aria-live="off">
            Since you opened this page, about <span className="text-foreground tabular-nums">{stopped}</span>{" "}
            {stopped === 1 ? "clock has" : "clocks have"} stopped worldwide.
          </p>
        </figure>

        <a
          href="#profile"
          className="scroll-cue inline-flex items-center gap-2 self-start font-mono text-sm tracking-widest text-muted-foreground uppercase hover:text-foreground lg:hidden"
        >
          Start
          <ArrowDownIcon className="size-4" aria-hidden />
        </a>
      </section>

      <section
        id="profile"
        className="relative flex scroll-mt-4 flex-col justify-center px-6 pt-4 pb-20 sm:px-12 lg:border-l lg:border-border lg:py-24"
      >
        <ProfileForm now={now} initial={initial} onDone={onDone} />
      </section>
    </div>
  );
}
