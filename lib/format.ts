import { YEAR_MS } from "./lifespan";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export type Duration = { years: number; days: number; hours: number; minutes: number; seconds: number };

export function splitDuration(ms: number): Duration {
  const total = Math.max(0, Math.floor(ms / 1000));
  const years = Math.floor((total * 1000) / YEAR_MS);
  let rest = total - Math.floor((years * YEAR_MS) / 1000);
  const days = Math.floor(rest / 86400);
  rest -= days * 86400;
  const hours = Math.floor(rest / 3600);
  rest -= hours * 3600;
  const minutes = Math.floor(rest / 60);
  return { years, days, hours, minutes, seconds: rest - minutes * 60 };
}

export const pad = (n: number, width: number) => String(n).padStart(width, "0");

export const fmtYears = (y: number) =>
  y.toLocaleString("en", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export const fmtSignedYears = (y: number) => `${y >= 0 ? "+" : "−"}${fmtYears(Math.abs(y))}`;
