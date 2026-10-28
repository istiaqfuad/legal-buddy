export function friendlyAuthError(error: unknown): string {
  const raw =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';

  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';

  const value = `${code} ${raw}`.toLowerCase();

  if (value.includes('invalid email or password') || value.includes('invalid_email_or_password')) {
    return 'That email and password do not match. Check them and try again.';
  }
  if (value.includes('user already exists') || value.includes('user_already_exists')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (value.includes('password too short') || value.includes('password_too_short')) {
    return 'Use a password with at least 8 characters.';
  }
  if (value.includes('invalid email') || value.includes('invalid_email')) {
    return 'Enter a valid email address.';
  }
  if (value.includes('rate limit') || value.includes('too many')) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  if (value.includes('network') || value.includes('fetch')) {
    return 'Could not reach the sign-in service. Check your connection and try again.';
  }

  return raw || 'Something went wrong. Please try again.';
}
