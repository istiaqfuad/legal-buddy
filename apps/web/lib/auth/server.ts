import { createNeonAuth } from '@neondatabase/auth/next/server';

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl) {
  throw new Error('NEON_AUTH_BASE_URL is not set. Copy the Auth base URL from the Neon Console.');
}

if (!cookieSecret || cookieSecret.length < 32) {
  throw new Error(
    'NEON_AUTH_COOKIE_SECRET must be set to a random string of at least 32 characters. Generate one with: openssl rand -base64 32',
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
