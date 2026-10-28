'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { friendlyAuthError } from '@/lib/auth/errors';
import {
  AuthError,
  AuthNotice,
  FieldLabel,
  GoogleButton,
  OrDivider,
  PasswordField,
  TextField,
  primaryButtonClass,
} from './fields';

export function SignInForm({
  redirectTo,
  registered = false,
}: {
  redirectTo: string;
  registered?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const finish = () => {
    router.push(redirectTo);
    router.refresh();
  };

  async function signInWithGoogle() {
    setError('');
    setGoogleLoading(true);
    try {
      const { error: authError } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}${redirectTo}`,
      });
      if (authError) {
        setError(friendlyAuthError(authError));
        setGoogleLoading(false);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
      setGoogleLoading(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setEmailLoading(true);

    try {
      const { error: authError } = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: `${window.location.origin}${redirectTo}`,
        rememberMe: true,
      });

      if (authError) {
        setError(friendlyAuthError(authError));
        return;
      }

      finish();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setEmailLoading(false);
    }
  }

  const busy = emailLoading || googleLoading;

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-200/70">
        Welcome back
      </p>
      <h2 className="font-display mt-2 text-[2rem] font-semibold leading-tight tracking-tight text-white">
        Sign in to LegalBuddy
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-white/50">
        New here?{' '}
        <Link
          href="/auth/sign-up"
          className="font-semibold text-amber-200 underline-offset-4 hover:underline"
        >
          Create a free account
        </Link>
      </p>

      <div className="mt-6 space-y-4">
        {registered && <AuthNotice message="Account created. Sign in to continue." />}
        {error && <AuthError message={error} />}

        <GoogleButton
          label="Continue with Google"
          onClick={signInWithGoogle}
          loading={googleLoading}
          disabled={busy}
        />

        <OrDivider />

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
            <TextField
              id="sign-in-email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              disabled={busy}
              required
            />
          </div>

          <div>
            <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
            <PasswordField
              id="sign-in-password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              disabled={busy}
            />
          </div>

          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {emailLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : null}
            {emailLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-[12px] leading-relaxed text-white/35">
          Trouble signing in? Use Google, or{' '}
          <a href="mailto:hello@legalbuddy.app" className="text-white/55 underline-offset-4 hover:underline">
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
}
