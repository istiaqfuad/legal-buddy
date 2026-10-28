import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://legalbuddy.irflab.tech";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LegalBuddy | Bangladesh law, explained with sources",
    template: "%s | LegalBuddy",
  },
  description:
    "Ask a question about Bangladesh law in Bangla or English. LegalBuddy explains the rule in plain language and links every point to the act and section it came from.",
  keywords: [
    "Bangladesh law",
    "legal research",
    "Penal Code",
    "CrPC",
    "Evidence Act",
    "statute search",
    "legal AI",
    "Bangla legal assistant",
  ],
  openGraph: {
    title: "LegalBuddy | Bangladesh law, explained with sources",
    description:
      "Clear answers to Bangladesh legal questions, with links to the act and section behind every point.",
    type: "website",
    siteName: "LegalBuddy",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "LegalBuddy | Bangladesh law, explained with sources",
    description:
      "Clear answers to Bangladesh legal questions, with links to the act and section behind every point.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
