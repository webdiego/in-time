import { useMemo, useSyncExternalStore } from "react";
import { findCountry, type Sex } from "./lifespan";
import type { Lifestyle } from "./lifestyle";

export type Profile = {
  birthDate: string;
  country: string;
  sex: Sex;
  lifestyle: Lifestyle;
  heightCm?: number;
  weightKg?: number;
  /** Left empty: sleep counts as 8 h for the time budget and isn't a risk factor. */
  sleepHours?: number;
  /** Left empty: no work is subtracted. */
  workHoursPerWeek?: number;
  retirementAge?: number;
};

const STORAGE_KEY = "in-time:profile";
const CHANGE_EVENT = "in-time:profile";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function snapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): Profile | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Profile;
    if (!p.birthDate || !findCountry(p.country)) return null;
    return { ...p, lifestyle: p.lifestyle ?? {} };
  } catch {
    return null;
  }
}

export function useProfile(): Profile | null {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  return useMemo(() => parse(raw), [raw]);
}

export function saveProfile(profile: Profile | null) {
  try {
    if (profile) localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode): the clock just won't survive a reload.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribeClock(onChange: () => void) {
  const id = setInterval(onChange, 250);
  return () => clearInterval(id);
}

/** Current time rounded to the second, `null` during server render. */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribeClock,
    () => Math.floor(Date.now() / 1000) * 1000,
    () => null,
  );
}
