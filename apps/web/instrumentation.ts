/**
 * Runs once when the Next.js server starts. Turns a missing database
 * configuration into a clear log line instead of a stream of `fetch failed`
 * errors from the Neon driver at request time.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { isDatabaseConfigured } = await import('./lib/db');
  if (!isDatabaseConfigured()) {
    console.error(
      '[LegalBuddy] No database configured for the web service. ' +
        'Set DATABASE_URL (or POSTGRES_CONNECTION_STRING) in the deployment environment. ' +
        'Until then /documents and chat history will not work.',
    );
  }
}
