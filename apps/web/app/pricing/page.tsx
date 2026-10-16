import Link from "next/link";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Pricing — Law Buddy",
  description:
    "Start free with 5 cited answers a day. Upgrade to Professional (৳499/mo) or Chamber (৳2,499/mo). Stripe checkout coming soon — founding-member pricing locked for life.",
};

const ASSURANCES = [
  "No credit card required to start",
  "Stripe-secured checkout coming soon",
  "Cancel anytime, keep free plan",
  "Founding-member pricing locked for life",
];

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-bg text-text">
      <Navbar />
      <main className="ink-canvas relative overflow-hidden pt-32">
        <div className="grid-overlay absolute inset-0" />
        <div className="noise-overlay absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[13px] font-medium text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back home
          </Link>
          <h1 className="font-display mt-6 text-balance text-5xl font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl">
            Pricing that pays for itself in <span className="text-gradient-gold">one answer</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/60">
            Hours of library research, compressed into seconds — with citations
            your senior can verify.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {ASSURANCES.map((a) => (
              <span key={a} className="inline-flex items-center gap-1.5 text-[13px] text-white/55">
                <BadgeCheck className="h-4 w-4 text-emerald-300" /> {a}
              </span>
            ))}
          </div>
        </div>
        {/* blend into light pricing section */}
        <div className="relative mt-14 h-10 bg-[#f6f6f3] [clip-path:ellipse(75%_100%_at_50%_100%)] dark:bg-[#0c100e]" />
      </main>
      <div className="-mt-2">
        <Pricing compact />
      </div>
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
