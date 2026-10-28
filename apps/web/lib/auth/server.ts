import { createNeonAuth } from '@neondatabase/auth/next/server';

const baseUrl =
  process.env.NEON_AUTH_BASE_URL ||
  process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL ||
  'https://ep-flat-brook-b3wu7lak.neonauth.c-4.ap-southeast-1.aws.neon.tech';
const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ||
  'development-or-build-time-secret-replace-in-env-32-chars';

if (
  process.env.NODE_ENV === 'production' &&
  !process.env.CI &&
  (!process.env.NEON_AUTH_COOKIE_SECRET || process.env.NEON_AUTH_COOKIE_SECRET.length < 32)
) {
  console.warn(
    '[LegalBuddy Auth] Warning: NEON_AUTH_COOKIE_SECRET is missing or under 32 chars in production. Using fallback secret.',
  );
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
    // OAuth returns from a top-level cross-site redirect, so Lax keeps the
    // session cookie available while still blocking cross-site form posts.
    sameSite: 'lax',
  },
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
});
