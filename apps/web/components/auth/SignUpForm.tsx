'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { friendlyAuthError } from '@/lib/auth/errors';
import {
  AuthError,
  FieldLabel,
  GoogleButton,
  OrDivider,
  PasswordField,
  TextField,
  primaryButtonClass,
} from './fields';

export function SignUpForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function signUpWithGoogle() {
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
      const { error: authError } = await authClient.signUp.email({
        name: name.trim() || email.split('@')[0] || 'LegalBuddy user',
        email: email.trim(),
        password,
        callbackURL: `${window.location.origin}${redirectTo}`,
      });

      if (authError) {
        setError(friendlyAuthError(authError));
        return;
      }

      const { data } = await authClient.getSession();
      if (data?.session) {
        router.push(redirectTo);
        router.refresh();
        return;
      }

      router.push('/auth/sign-in?registered=1');
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
        Free account
      </p>
      <h2 className="font-display mt-2 text-[2rem] font-semibold leading-tight tracking-tight text-white">
        Create your account
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-white/50">
        Already have an account?{' '}
        <Link
          href="/auth/sign-in"
          className="font-semibold text-amber-200 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>

      <div className="mt-6 space-y-4">
        {error && <AuthError message={error} />}

        <GoogleButton
          label="Sign up with Google"
          onClick={signUpWithGoogle}
          loading={googleLoading}
          disabled={busy}
        />

        <OrDivider />

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <FieldLabel htmlFor="sign-up-name" hint="Optional">
              Name
            </FieldLabel>
            <TextField
              id="sign-up-name"
              type="text"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="How should we address you?"
              autoComplete="name"
              disabled={busy}
            />
          </div>

          <div>
            <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
            <TextField
              id="sign-up-email"
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
            <FieldLabel htmlFor="sign-up-password" hint="8+ characters">
              Password
            </FieldLabel>
            <PasswordField
              id="sign-up-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              disabled={busy}
            />
          </div>

          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {emailLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : null}
            {emailLoading ? 'Creating account…' : 'Create free account'}
          </button>
        </form>

        <p className="text-center text-[12px] leading-relaxed text-white/35">
          By creating an account you agree to use LegalBuddy for general legal
          information and to check the cited source before relying on it.
        </p>
      </div>
    </div>
  );
}
