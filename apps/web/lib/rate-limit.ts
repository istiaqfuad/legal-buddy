import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@ep-dummy.aws.neon.tech/neondb');

const TIER_LIMITS: Record<string, number> = {
  free: 5,
  starter: 30,
  professional: 999999, // unlimited
  enterprise: 999999,
};

export async function checkAndIncrementLimit(userId: string, tier: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;

  const rows = await sql`
    INSERT INTO query_limits (user_id, date, count)
    VALUES (${userId}, ${today}, 1)
    ON CONFLICT (user_id, date) DO UPDATE
    SET count = query_limits.count + 1
    RETURNING count
  `;

  const count = rows[0]?.count ?? 1;
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    limit,
  };
}

export async function getCurrentUsage(userId: string): Promise<{ count: number; date: string }> {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await sql`
    SELECT count FROM query_limits
    WHERE user_id = ${userId} AND date = ${today}
  `;
  return { count: rows[0]?.count ?? 0, date: today };
}
