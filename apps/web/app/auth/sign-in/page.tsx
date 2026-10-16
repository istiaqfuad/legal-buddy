import Link from "next/link";
import { SignInForm } from "@neondatabase/auth-ui";
import { ShieldCheck, FileCheck2, Zap } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const POINTS = [
  { icon: FileCheck2, text: "Every answer cited to the section" },
  { icon: Zap, text: "5 free cited answers every day" },
  { icon: ShieldCheck, text: "Grounded retrieval — no hallucinated law" },
];

export default function SignInPage() {
  return (
    <div className="ink-canvas relative grid min-h-dvh overflow-hidden lg:grid-cols-2">
      <div className="grid-overlay absolute inset-0" />
      <div className="noise-overlay absolute inset-0" />
      <div className="orb orb-a left-[-100px] top-[20%] h-[380px] w-[380px] bg-emerald-500/25" />
      <div className="orb orb-b right-[-80px] top-[-40px] h-[320px] w-[320px] bg-amber-400/15" />

      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="h-10 w-10" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl font-semibold tracking-tight text-white">Law Buddy</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-amber-200/70">
              Bangladesh Law AI
            </span>
          </span>
        </Link>
        <div>
          <h1 className="font-display max-w-md text-balance text-5xl font-semibold leading-[1.04] tracking-tight text-white">
            Welcome back, <span className="text-gradient-gold">counsellor.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-white/60">
            Your cited research workspace is waiting. Pick up exactly where you left off.
          </p>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-[15px] text-white/75">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/6">
                  <p.icon className="h-4 w-4 text-amber-200" />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[13px] text-white/35">General information only — not legal advice.</p>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-6 flex items-center gap-2.5 lg:hidden">
            <Logo className="h-9 w-9" />
            <span className="font-display text-lg font-semibold text-white">Law Buddy</span>
          </Link>
          <div className="rounded-[26px] border border-white/12 bg-white/[0.06] p-7 shadow-2xl backdrop-blur-xl sm:p-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-white">Sign in</h2>
            <p className="mt-1.5 text-sm text-white/55">
              Bangladesh legal assistant — sign in to continue.{" "}
              <Link href="/auth/sign-up" className="font-semibold text-amber-200 hover:underline">
                New here? Create an account
              </Link>
            </p>
            <div className="mt-6 rounded-2xl bg-white p-5">
              <SignInForm localization={{}} />
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-white/35">
            General information only — not legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}
