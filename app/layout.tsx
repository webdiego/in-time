import type { Metadata } from "next";
import { Geist, Share_Tech_Mono } from "next/font/google";
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
    <html lang="en" className={`dark ${geistSans.variable} ${clockFont.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
