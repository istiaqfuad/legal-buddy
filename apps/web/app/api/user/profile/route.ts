import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getOrCreateProfile } from '@/lib/db/queries';
import { getCurrentUsage, limitForTier } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to view your profile.' }, { status: 401 });
  }

  const profile = await getOrCreateProfile(user.id);
  const usage = await getCurrentUsage(user.id);
  const tier = profile?.subscriptionTier ?? 'free';
  const limit = limitForTier(tier);

  // Keep the JSON contract in one naming style (snake_case) instead of
  // leaking Drizzle's camelCase column names to the client.
  return NextResponse.json({
    user,
    profile: profile
      ? {
          id: profile.id,
          auth_user_id: profile.authUserId,
          role: profile.role,
          subscription_tier: profile.subscriptionTier,
          display_name: profile.displayName,
          phone: profile.phone,
          location: profile.location,
          created_at: profile.createdAt.toISOString(),
          updated_at: profile.updatedAt.toISOString(),
        }
      : null,
    usage: {
      used: usage.count,
      date: usage.date,
      limit,
      remaining: Math.max(0, limit - usage.count),
    },
  });
}
