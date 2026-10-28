import { auth } from '@/lib/auth/server';

export default auth.middleware({ loginUrl: '/auth/sign-in' });

export const config = {
  matcher: [
    // Signed-in areas. Public marketing pages and auth pages stay open.
    '/chat/:path*',
    '/documents/:path*',
    '/dashboard/:path*',
    '/lawyer/:path*',
  ],
};
