"use client";

import { useSyncExternalStore } from "react";
import FaultyTerminal from "@/components/faulty-terminal";
import { useTheme } from "@/lib/theme";

function subscribeMotion(onChange: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
const motionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The hero's animated backdrop: React Bits' terminal-glitch effect (see
 * faulty-terminal.tsx), tinted to this app's green accent in either theme.
 *
 * Renders nothing — leaving the flat, static .hud-grid behind it as the only
 * background — until we positively know both the theme and that the visitor
 * doesn't prefer reduced motion. A WebGL canvas is a flourish, not something
 * worth a layout flash or a hydration mismatch over.
 */
export function HeroBackground() {
  const theme = useTheme();
  const reducedMotion = useSyncExternalStore(subscribeMotion, motionSnapshot, () => null);
  if (theme === null || reducedMotion !== false) return null;

  const dark = theme === "dark";
  return (
    <FaultyTerminal
      className="h-full w-full"
      tint={dark ? "#3dff6e" : "#15803d"}
      // lightMode both switches the canvas's own clear color to match a pale
      // page (vs. black) and inverts the pattern to dark ink on it. At the
      // shader's default brightness the tint saturates/clips before that
      // inversion and comes out neutral grey; a much lower brightness keeps
      // it under that ceiling so the green actually survives.
      lightMode={!dark}
      brightness={dark ? 0.55 : 0.16}
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
      dither={dark ? 0.3 : 0}
    />
  );
}
