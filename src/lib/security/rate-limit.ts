type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function rateLimit(
  key: string,
  options?: { limit?: number; windowSec?: number }
): RateLimitResult {
  const limit = options?.limit ?? envInt("RATE_LIMIT_DEFAULT", 60);
  const windowSec = options?.windowSec ?? envInt("RATE_LIMIT_WINDOW_SEC", 60);
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { allowed: true, remaining: limit - 1, retryAfterSec: windowSec };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function progressiveLoginDelayMs(failedCount: number): number {
  if (failedCount <= 0) return 0;
  return Math.min(8000, 250 * 2 ** Math.min(failedCount, 5));
}

export function __resetRateLimitBuckets() {
  buckets.clear();
}
