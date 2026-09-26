"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "in-time:theme";
const CHANGE_EVENT = "in-time:theme";

/**
 * Inline script executed synchronously as the very first thing in <body>,
 * before React hydrates or anything else paints. This is what prevents a
 * flash of the wrong theme: by the time the browser has anything to paint,
 * the `dark` class is already correct. Dark is the default (it's the film's
 * look); light only applies once the visitor picks it.
 */
export const INIT_THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})==="light"?"light":"dark";document.documentElement.classList.toggle("dark",t==="dark");}catch(e){document.documentElement.classList.add("dark");}})();`;

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function snapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Current theme, `null` during server render (the inline script decides the real initial value). */
export function useTheme(): Theme | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode): the choice just won't survive a reload.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
