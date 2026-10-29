import { createNeonAuth } from '@neondatabase/auth/next/server';

// Neon Auth is served under /neondb/auth. Accept either the full Console URL
// or a bare host so a truncated env value cannot send requests to
// /sign-in/social instead of /neondb/auth/sign-in/social.
const DEFAULT_AUTH_BASE_URL =
  'https://ep-flat-brook-b3wu7lak.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth';

function normalizeAuthBaseUrl(raw: string): string {
  const url = new URL(raw.trim());
  const path = url.pathname.replace(/\/+$/, '');
  return path ? `${url.origin}${path}` : `${url.origin}/neondb/auth`;
}

// AUTH_URL is the full auth endpoint already present in the deployment .env.
// NEON_AUTH_BASE_URL and the public variant are accepted too for local setups.
const configuredBaseUrl =
  process.env.AUTH_URL ||
  process.env.NEON_AUTH_BASE_URL ||
  process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL ||
  DEFAULT_AUTH_BASE_URL;
const baseUrl = normalizeAuthBaseUrl(configuredBaseUrl);

// Keep a deterministic value during `next build`, where runtime secrets are
// intentionally absent from the Docker build context.
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;
const effectiveCookieSecret =
  cookieSecret && cookieSecret.length >= 32
    ? cookieSecret
    : 'development-or-build-time-secret-replace-in-env-32-chars';

if (!isBuild && (!cookieSecret || cookieSecret.length < 32)) {
  console.warn(
    '[LegalBuddy Auth] NEON_AUTH_COOKIE_SECRET is missing or under 32 chars. Session cookies are using an insecure fallback.',
  );
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: effectiveCookieSecret,
    // OAuth returns from a top-level cross-site redirect, so Lax keeps the
    // session cookie available while still blocking cross-site form posts.
    sameSite: 'lax',
  },
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
});
