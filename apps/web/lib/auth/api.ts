import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

export async function withUser<T>(
  handler: (user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>) => Promise<T>,
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
  }
  return handler(user);
}
