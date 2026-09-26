"use client";

import { useEffect, useRef, useState, type AnimationEvent } from "react";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/hero-background";
import { ProfileForm } from "@/components/profile-form";
import type { Profile } from "@/lib/profile";
import styles from "./landing.module.css";

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

/**
 * facts → retracting → deploying → form. "Start" retracts the facts panel and
 * deploys the form in its place, all inside the hero. Editing an existing
 * profile opens straight on the form.
 */
type Phase = "facts" | "retracting" | "deploying" | "form";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Landing({ now, initial, onDone }: { now: number; initial?: Profile | null; onDone?: () => void }) {
  const [openedAt] = useState(now);
  const stopped = Math.floor(((now - openedAt) / 1000) * DEATHS_PER_SECOND);

  const [phase, setPhase] = useState<Phase>(initial ? "form" : "facts");
  const started = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const showForm = phase === "deploying" || phase === "form";

  function start() {
    started.current = true;
    setPhase(prefersReducedMotion() ? "form" : "retracting");
  }

  // Only react to the wrapper's own shutter animation, not to animations bubbling up from inside it.
  function onShutterEnd(e: AnimationEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget || !/retract|deploy/.test(e.animationName)) return;
    setPhase((p) => (p === "retracting" ? "deploying" : p === "deploying" ? "form" : p));
  }

  useEffect(() => {
    if (!started.current || !panelRef.current) return;
    const panel = panelRef.current;
    // Stacked layout (mobile): the panel sits below the copy, so bring it into view as it deploys.
    if (phase === "deploying" && panel.getBoundingClientRect().top > window.innerHeight * 0.6) {
      panel.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    // Hand keyboard focus to the first field once the form is fully out.
    if (phase === "form") panel.querySelector<HTMLElement>("button, input")?.focus({ preventScroll: true });
  }, [phase]);

  return (
    <div className="relative flex w-full flex-1 flex-col">
      <div className="hud-grid pointer-events-none absolute inset-0" aria-hidden />

      <section aria-labelledby="hero-title" className="relative flex min-h-svh flex-col justify-center overflow-hidden">
        <div className="absolute inset-0">
          <HeroBackground />
        </div>
        {/* Scrim: the animated background is decoration, the text has to win. */}
        <div className="absolute inset-0 bg-background/70" aria-hidden />

        <div
          className={`${styles.stage} relative z-10 mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 sm:px-12 lg:gap-16 lg:px-16 xl:px-24 ${
            showForm
              ? "lg:grid-cols-[0.8fr_1.2fr] lg:items-start"
              : "lg:grid-cols-[1.2fr_1fr] lg:items-center"
          }`}
        >
          <div className={`flex flex-col gap-10 ${showForm ? "lg:sticky lg:top-20" : ""}`}>
            <p className="hud-tag">{showForm ? "Life-clock · calibrating" : "Life-clock · online"}</p>

            <div className="flex flex-col gap-6">
              <h1
                id="hero-title"
                className={`digits whitespace-nowrap text-6xl! sm:text-7xl! ${showForm ? "" : "xl:text-8xl!"}`}
              >
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

            {phase === "facts" && (
              <Button onClick={start} className="cta h-12 self-start rounded-full">
                Start
                <ArrowRightIcon aria-hidden />
              </Button>
            )}
          </div>

          <div
            ref={panelRef}
            onAnimationEnd={onShutterEnd}
            className={`${styles.shutter} scroll-mt-6 ${
              phase === "retracting" ? styles.retracting : phase === "deploying" ? styles.deploying : ""
            }`}
          >
            {showForm ? (
              <ProfileForm now={now} initial={initial} onDone={onDone} />
            ) : (
              <ul className="hud-frame flex flex-col divide-y divide-border">
                {FACTS.map((f) => (
                  <li key={f.k} className="flex gap-4 p-5">
                    <span className="step-index shrink-0 font-mono text-sm">{f.k}</span>
                    <span className="text-sm leading-relaxed text-muted-foreground">{f.v}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
