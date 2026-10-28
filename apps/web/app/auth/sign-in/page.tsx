import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignInForm } from '@/components/auth/SignInForm';
import { auth } from '@/lib/auth/server';
import { safeRedirect } from '@/lib/auth/redirect';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sign in | LegalBuddy',
  description: 'Sign in to continue your LegalBuddy research, sources and saved documents.',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = safeRedirect(params.redirectTo);
  const { data } = await auth.getSession();

  if (data?.user) {
    redirect(redirectTo);
  }

  return (
    <AuthShell mode="sign-in">
      <SignInForm redirectTo={redirectTo} registered={params.registered === '1'} />
    </AuthShell>
  );
}
