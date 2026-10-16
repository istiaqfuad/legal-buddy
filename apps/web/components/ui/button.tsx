import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "gold" | "ghost" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-[#1d8a66] to-[#0e5a42] text-white shadow-[0_10px_28px_-10px_rgba(20,113,83,0.6)] hover:brightness-110 hover:-translate-y-px active:translate-y-0 disabled:opacity-45",
  gold:
    "bg-gradient-to-b from-[#e9cd8d] via-[#c9a45c] to-[#a8813c] text-[#1a1405] shadow-[0_10px_28px_-10px_rgba(201,164,92,0.6)] hover:brightness-105 hover:-translate-y-px active:translate-y-0 disabled:opacity-45",
  ghost: "text-muted hover:bg-accent-soft hover:text-accent-strong",
  outline:
    "border border-line bg-surface text-text hover:border-accent/40 hover:text-accent-strong hover:bg-accent-soft/50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
  icon: "h-9 w-9",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
