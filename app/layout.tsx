import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeBootstrap } from "@/components/theme-provider";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://notaryflow.app"),
  title: {
    default: "NotaryFlow — Run the entire signing business from your phone.",
    template: "%s · NotaryFlow",
  },
  description:
    "The notary platform built for solo mobile signing agents. Journal, scheduling, invoicing — and the first real sales pipeline for outreach to title companies.",
  keywords: ["notary", "loan signing agent", "notary CRM", "signing agent software", "notary journal"],
  openGraph: {
    title: "NotaryFlow",
    description:
      "Run the entire signing business from your phone. The only notary tool with a real sales pipeline.",
    type: "website",
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "NotaryFlow" },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)",  color: "#0B0F0C" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
