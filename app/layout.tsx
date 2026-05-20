import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bodoni_Moda } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeBootstrap } from "@/components/theme-provider";

/**
 * Type system (FORGE):
 *   - Geist Sans   — UI everything. Same as before; the chassis didn't break.
 *   - Geist Mono   — numerals everywhere. Streak, macros, day count, timers.
 *                    Loaded with `tnum` so columns of numbers line up.
 *   - Bodoni Moda  — editorial display. Landing hero, Day-N greeting on /daily,
 *                    Day 75 Receipt. *Never* in UI chrome. Italic accent is
 *                    the whole reason we picked a modern serif — it's the
 *                    "softness inside the steel" beat the brand needs.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const bodoni = Bodoni_Moda({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://forge.app"),
  title: {
    default: "FORGE — Forge yourself. Daily.",
    template: "%s · FORGE",
  },
  description:
    "The operating system for discipline. Daily habits, Hard 75, fuel tracking, and a five-man squad — built for men who are done being soft.",
  keywords: [
    "75 hard",
    "hard 75",
    "discipline app",
    "habit tracker",
    "mental toughness",
    "monk mode",
    "self improvement for men",
  ],
  openGraph: {
    title: "FORGE",
    description:
      "Forge yourself. Daily. The operating system for discipline.",
    type: "website",
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "FORGE" },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  // Dark is the brand. Light is preserved as an opt-in under Settings →
  // Appearance, but the chrome assumes dark and looks correct there.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F4F0" },
    { media: "(prefers-color-scheme: dark)",  color: "#0A0A0A" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bodoni.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
