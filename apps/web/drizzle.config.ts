import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

// Load apps/web/.env.local the same way Next.js does so drizzle-kit sees
// DATABASE_URL without requiring a separate export step.
loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Add it to apps/web/.env.local before running drizzle-kit.');
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
