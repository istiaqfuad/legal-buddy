import { redirect } from 'next/navigation';
import { auth } from './server';

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

/** Returns the signed-in user, or null in API routes. */
export async function getSessionUser(): Promise<AuthUser | null> {
  const { data } = await auth.getSession();
  const user = data?.user;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    image: user.image ?? null,
  };
}

/** Server-component guard: sends signed-out visitors to the sign-in page. */
export async function requireUser(redirectTo?: string): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    const target = redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : '';
    redirect(`/auth/sign-in${target}`);
  }
  return user;
}
