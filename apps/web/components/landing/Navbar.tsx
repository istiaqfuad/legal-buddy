"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Live demo", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6",
          scrolled ? "py-2.5" : "py-4"
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 border-b transition-all duration-300",
            scrolled
              ? "border-white/10 bg-[#060d0b]/85 backdrop-blur-xl"
              : "border-transparent bg-transparent"
          )}
        />
        <Link href="/" className="relative flex items-center gap-2.5">
          <Logo className="h-9 w-9 drop-shadow-[0_4px_16px_rgba(201,164,92,0.4)]" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[19px] font-semibold tracking-tight text-white">
              Law Buddy
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-amber-200/70">
              Bangladesh Law AI
            </span>
          </span>
        </Link>

        <nav className="relative hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/65 transition-colors hover:bg-white/8 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="relative hidden items-center gap-2.5 lg:flex">
          <Link
            href="/auth/sign-in"
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/75 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/chat"
            className="btn-shine btn-primary-gold group inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Start free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="relative rounded-xl border border-white/15 bg-white/5 p-2.5 text-white lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="fade-in mx-4 rounded-2xl border border-white/12 bg-[#0a1512]/95 p-3 shadow-2xl backdrop-blur-xl lg:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-[15px] font-medium text-white/80 hover:bg-white/8 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-2 flex gap-2 border-t border-white/10 pt-3">
            <Link
              href="/auth/sign-in"
              className="flex-1 rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Sign in
            </Link>
            <Link
              href="/chat"
              className="btn-primary-gold flex-1 rounded-xl px-4 py-3 text-center text-sm font-bold"
            >
              Start free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
