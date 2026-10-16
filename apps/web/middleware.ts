import { auth } from '@/lib/auth/server';

export default auth.middleware({ loginUrl: '/auth/sign-in' });

export const config = {
  matcher: [
    // Protect /chat and /dashboard routes, leave public pages and API open
    '/chat/:path*',
    '/dashboard/:path*',
    '/lawyer/:path*',
  ],
};
