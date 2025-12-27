import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import "./globals.css";

const bodyFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

const displayFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Ship-It - Find Your Co-Founder | Proof-of-Work Matching for Builders",
  description: "The curated network for founders who ship. Find co-founders through proof of work. Connect GitHub, showcase your projects, and match with serious builders.",
  keywords: ["cofounder", "startup", "founders", "technical cofounder", "find cofounder", "github", "proof of work", "builders", "makers"],
  authors: [{ name: "Ship-It" }],
  creator: "Ship-It",
  publisher: "Ship-It",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Ship-It - Find Your Co-Founder",
    description: "The curated network for founders who ship. Find co-founders through proof of work.",
    siteName: "Ship-It",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ship-It - Find Your Co-Founder",
    description: "The curated network for founders who ship. Find co-founders through proof of work.",
    creator: "@yourtwitterhandle", // TODO: Replace with actual Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
