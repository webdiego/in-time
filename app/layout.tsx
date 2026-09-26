import type { Metadata } from "next";
import { Geist, Share_Tech_Mono } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import { INIT_THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const clockFont = Share_Tech_Mono({
  variable: "--font-clock",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "In Time — how much time you have left",
  description:
    "Your biological clock, like in the film In Time: how much time you have left on average, based on your age, country and sex.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The inline script below sets this before paint; it deliberately differs
      // from what the server rendered, so React shouldn't warn about it.
      suppressHydrationWarning
      className={`dark ${geistSans.variable} ${clockFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Runs synchronously before anything else paints — see lib/theme.ts. */}
        <script dangerouslySetInnerHTML={{ __html: INIT_THEME_SCRIPT }} />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
