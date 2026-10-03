"use client";

import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/hero-background";

// Backed by this app's own numbers, not fabricated: see life-expectancy.json (Nigeria
// vs. Hong Kong, among countries of 1M+ people), lib/lifestyle.ts's hazard ratios, and
// the sleep/work share of a typical week in the results' time breakdown.
const FACTS = [
  {
    k: "01",
    v: "Where you're born can swing your life expectancy by more than 30 years.",
  },
  {
    k: "02",
    v: "Smoking, diet, sleep and activity together can shift your estimate by a decade or more.",
  },
  {
    k: "03",
    v: "For most people, sleep and work alone claim over half of what's left.",
  },
];

/** Home: a single hero. "Start" opens the profile dialog over it. */
export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative flex w-full flex-1 flex-col">
      <div
        className="hud-grid pointer-events-none absolute inset-0"
        aria-hidden
      />

      <section
        aria-labelledby="hero-title"
        className="relative flex min-h-svh flex-col justify-center overflow-hidden"
      >
        <div className="absolute inset-0">
          <HeroBackground />
        </div>
        {/* Scrim: the animated background is decoration, the text has to win. */}
        <div className="absolute inset-0 bg-background/70" aria-hidden />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 sm:px-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16 lg:px-16 xl:px-24">
          <div className="flex flex-col gap-10">
            <p className="hud-tag">Life-clock · online</p>

            <div className="flex flex-col gap-6">
              <h1
                id="hero-title"
                className="digits text-6xl! whitespace-nowrap sm:text-7xl! xl:text-8xl!"
              >
                IN TIME
              </h1>
              <p className="max-w-xl text-2xl leading-snug font-medium text-balance sm:text-3xl">
                Your clock started the day you were born. Find out how much time
                is left on it.
              </p>
              <p className="max-w-md leading-relaxed text-muted-foreground">
                In the film, time is the only currency and everyone can read
                what&apos;s left on their arm. Yours is invisible, but it&apos;s
                running all the same. We estimate it from today&apos;s mortality
                data for your age, country and sex.
              </p>
            </div>

            <p className="max-w-md font-mono text-xs text-muted-foreground">
              You can&apos;t save time, only spend it. The only choice is on what.
            </p>

            <Button
              onClick={onStart}
              className="cta h-12 gap-2.5 self-start rounded-full px-7 font-mono text-sm tracking-[0.14em] uppercase active:scale-[0.98]"
            >
              Start
              <ArrowRightIcon aria-hidden />
            </Button>
          </div>

          <ul className="hud-frame flex flex-col divide-y divide-border">
            {FACTS.map((f) => (
              <li key={f.k} className="flex gap-4 p-10">
                <span className="step-index shrink-0 font-mono text-sm">
                  {f.k}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {f.v}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
