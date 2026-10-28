'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoogleIcon } from './GoogleIcon';

const FIELD_CLASS =
  'h-12 w-full rounded-xl border border-white/14 bg-white/[0.045] px-4 text-[15px] text-white shadow-inner outline-none transition-all placeholder:text-white/30 hover:border-white/25 focus:border-amber-200/70 focus:bg-white/[0.07] focus:ring-4 focus:ring-amber-200/10 disabled:opacity-60';

export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-white/72">
        {children}
      </label>
      {hint && <span className="text-[11.5px] text-white/35">{hint}</span>}
    </div>
  );
}

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextField({ className, ...props }, ref) {
    return <input ref={ref} className={cn(FIELD_CLASS, className)} {...props} />;
  },
);

export function PasswordField({
  id,
  value,
  onChange,
  placeholder = 'At least 8 characters',
  autoComplete = 'current-password',
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={inputId}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required
        minLength={8}
        className={cn(FIELD_CLASS, 'pr-12')}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/8 hover:text-white/75"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/8 px-3.5 py-3 text-[13px] leading-relaxed text-red-200"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function AuthNotice({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/8 px-3.5 py-3 text-[13px] leading-relaxed text-emerald-100">
      {message}
    </div>
  );
}

export function GoogleButton({
  label,
  onClick,
  loading,
  disabled,
}: {
  label: string;
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white px-4 text-[14.5px] font-semibold text-[#1f2823] shadow-lg transition-all hover:-translate-y-px hover:bg-[#f7f7f4] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1512] disabled:cursor-not-allowed disabled:opacity-65"
    >
      {loading ? (
        <Loader2 className="h-4.5 w-4.5 animate-spin" />
      ) : (
        <GoogleIcon className="h-[19px] w-[19px]" />
      )}
      {loading ? 'Opening Google…' : label}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
        or use email
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

export const primaryButtonClass =
  'btn-shine flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e9cd8d] via-[#c9a45c] to-[#b3893f] px-4 text-[14.5px] font-bold text-[#1a1405] shadow-[0_12px_32px_-10px_rgba(201,164,92,0.5)] transition-all hover:-translate-y-px hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1512] disabled:cursor-not-allowed disabled:opacity-60';
