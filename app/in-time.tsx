"use client";

import { useState } from "react";
import { Landing } from "@/components/landing";
import { LifeClock } from "@/components/life-clock";
import { useNow, useProfile } from "@/lib/profile";

export default function InTime() {
  const profile = useProfile();
  const now = useNow();
  const [editing, setEditing] = useState(false);

  if (now === null) return <div className="min-h-svh" />;
  if (!profile || editing) {
    return <Landing now={now} initial={profile} onDone={profile ? () => setEditing(false) : undefined} />;
  }
  return (
    <div className="relative flex flex-1 flex-col items-center px-4 py-16 sm:py-24">
      <div className="hud-grid pointer-events-none absolute inset-0" aria-hidden />
      <header className="relative mb-14 flex flex-col items-center gap-3 text-center">
        <p className="hud-tag">Life-clock · synced</p>
        <h1 className="digits text-3xl! sm:text-4xl!">IN TIME</h1>
        <p className="text-sm tracking-wide text-muted-foreground">
          How much time you have left, according to today&apos;s data.
        </p>
      </header>
      <div className="relative w-full">
        <LifeClock profile={profile} now={now} onEdit={() => setEditing(true)} />
      </div>
    </div>
  );
}
