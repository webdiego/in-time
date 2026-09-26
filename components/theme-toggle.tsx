"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setTheme, useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const theme = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="fixed top-4 right-4 z-10 rounded-full bg-card"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {/* Rendered only once the real theme is known, so the icon never flashes wrong. */}
      {theme && (theme === "dark" ? <SunIcon aria-hidden /> : <MoonIcon aria-hidden />)}
    </Button>
  );
}
