/** Only allow same-app paths as post-auth destinations. */
export function safeRedirect(value: string | null | undefined, fallback = '/chat'): string {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.startsWith('/auth/')) return fallback;
  return value;
}
