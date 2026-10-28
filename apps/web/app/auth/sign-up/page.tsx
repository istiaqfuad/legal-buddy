import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { auth } from '@/lib/auth/server';
import { safeRedirect } from '@/lib/auth/redirect';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Create a free account | LegalBuddy',
  description: 'Create a free LegalBuddy account and get sourced answers to Bangladesh legal questions.',
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = safeRedirect(params.redirectTo);
  const { data } = await auth.getSession();

  if (data?.user) {
    redirect(redirectTo);
  }

  return (
    <AuthShell mode="sign-up">
      <SignUpForm redirectTo={redirectTo} />
    </AuthShell>
  );
}
