"use client";

import { useSyncExternalStore } from "react";
import FaultyTerminal from "@/components/faulty-terminal";

function subscribeMotion(onChange: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
const motionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The hero's animated backdrop: React Bits' terminal-glitch effect (see
 * faulty-terminal.tsx), tinted to this app's green accent.
 *
 * Renders nothing — leaving the flat, static .hud-grid behind it as the only
 * background — until we positively know the visitor doesn't prefer reduced
 * motion. A WebGL canvas is a flourish, not something worth a hydration
 * mismatch over.
 */
export function HeroBackground() {
  const reducedMotion = useSyncExternalStore(subscribeMotion, motionSnapshot, () => null);
  if (reducedMotion !== false) return null;

  return (
    <FaultyTerminal
      className="h-full w-full"
      tint="#3dff6e"
      brightness={0.75}
      // Slower and calmer: the defaults read as a busy, repetitive glitch tic
      // within a few seconds of watching it; this stretches that period out
      // and softens the flicker/displacement so it sits in the background
      // instead of drawing the eye.
      timeScale={0.12}
      glitchAmount={0.5}
      flickerAmount={0.35}
      scanlineIntensity={0.25}
      curvature={0.15}
      // Performance: the shader runs ~10 noise-heavy samples per pixel, so cost
      // scales with pixel count. Rendering at 0.75x CSS resolution (not the
      // retina 2x default) cuts pixels ~7x on a HiDPI screen; the pattern is
      // coarse blocks anyway, so the softer upscale doesn't read as blur.
      // Chromatic aberration would triple the per-pixel work for a barely
      // visible fringe, and 30 fps is indistinguishable at this slow timeScale.
      dpr={0.75}
      maxFps={30}
      chromaticAberration={0}
      mouseStrength={0.15}
      dither={0.3}
    />
  );
}
