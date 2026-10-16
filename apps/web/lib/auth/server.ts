import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || 'https://ep-flat-brook-b3wu7lak.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth',
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || 'law-buddy-super-secret-cookie-key-32chars!',
  },
});
