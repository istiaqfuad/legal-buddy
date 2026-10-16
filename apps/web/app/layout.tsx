import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./provider";

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

export const metadata: Metadata = {
  title: "Law Buddy — Bangladesh Legal Answers, Cited to the Section",
  description:
    "Ask questions about Bangladesh statutory law and case-law precedent. Law Buddy retrieves the exact sections and answers with clickable citations you can verify.",
  keywords: ["Bangladesh law", "legal AI", "Penal Code", "statute search", "legal research", "writ petition", "case law"],
  openGraph: {
    title: "Law Buddy — Legal answers, cited to the section",
    description:
      "Bangladesh's AI legal companion. Grounded answers with section-level citations, not hallucinations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
