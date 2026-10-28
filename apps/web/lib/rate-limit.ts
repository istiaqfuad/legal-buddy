import {
  getCurrentUsage,
  incrementUsageWithinLimit,
} from './db/queries';

export const TIER_LIMITS: Record<string, number> = {
  free: 5,
  starter: 30,
  professional: 1_000_000,
  enterprise: 1_000_000,
};

export function limitForTier(tier: string): number {
  return TIER_LIMITS[tier] ?? TIER_LIMITS.free;
}

export async function checkAndIncrementLimit(
  userId: string,
  tier: string,
): Promise<{ allowed: boolean; remaining: number; limit: number; used: number }> {
  const limit = limitForTier(tier);
  const used = await incrementUsageWithinLimit(userId, limit);

  if (used === null) {
    const current = await getCurrentUsage(userId);
    return { allowed: false, remaining: 0, limit, used: current.count };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - used),
    limit,
    used,
  };
}

export { getCurrentUsage };
