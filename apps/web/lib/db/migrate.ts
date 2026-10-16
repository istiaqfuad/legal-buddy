import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@ep-dummy.aws.neon.tech/neondb');

async function migrate() {
  console.log('Running migrations...');
  
  try { await sql`CREATE TYPE user_role AS ENUM ('user', 'lawyer', 'admin')`; } catch (e) {}
  try { await sql`CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'professional', 'enterprise')`; } catch (e) {}
  try { await sql`CREATE TYPE chat_session_status AS ENUM ('active', 'archived')`; } catch (e) {}

  await sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_user_id TEXT NOT NULL UNIQUE,
      role user_role NOT NULL DEFAULT 'user',
      subscription_tier subscription_tier NOT NULL DEFAULT 'free',
      display_name TEXT,
      phone TEXT,
      location TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'New conversation',
      status chat_session_status NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      sources JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS query_limits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, date)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS lawyer_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL UNIQUE,
      bar_council_id TEXT,
      verification_level TEXT NOT NULL DEFAULT 'basic',
      specializations JSONB DEFAULT '[]',
      location TEXT,
      years_experience INTEGER,
      bio TEXT,
      consultation_fee INTEGER,
      is_available BOOLEAN NOT NULL DEFAULT true,
      rating INTEGER DEFAULT 0,
      review_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log('Migrations complete!');
}

migrate().catch(console.error);
