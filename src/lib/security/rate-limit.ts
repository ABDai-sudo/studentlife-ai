type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

export type RateLimitSnapshot = {
  count: number;
  resetAt: number;
};

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Shared decision for in-memory and Postgres-backed limiters. */
export function decideRateLimit(
  existing: RateLimitSnapshot | null,
  now: number,
  limit: number,
  windowSec: number
): {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
  next: RateLimitSnapshot;
  mutated: boolean;
} {
  const windowMs = windowSec * 1000;
  if (!existing || existing.resetAt <= now) {
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSec: windowSec,
      next: { count: 1, resetAt: now + windowMs },
      mutated: true,
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000)
      ),
      next: existing,
      mutated: false,
    };
  }

  const count = existing.count + 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - count),
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    next: { count, resetAt: existing.resetAt },
    mutated: true,
  };
}

export function rateLimit(
  key: string,
  options?: { limit?: number; windowSec?: number }
): RateLimitResult {
  const limit = options?.limit ?? envInt("RATE_LIMIT_DEFAULT", 60);
  const windowSec = options?.windowSec ?? envInt("RATE_LIMIT_WINDOW_SEC", 60);
  const now = Date.now();
  const existing = buckets.get(key) ?? null;
  const decision = decideRateLimit(existing, now, limit, windowSec);
  if (decision.mutated) {
    buckets.set(key, decision.next);
  }
  return {
    allowed: decision.allowed,
    remaining: decision.remaining,
    retryAfterSec: decision.retryAfterSec,
  };
}

export function progressiveLoginDelayMs(failedCount: number): number {
  if (failedCount <= 0) return 0;
  return Math.min(8000, 250 * 2 ** Math.min(failedCount, 5));
}

export function __resetRateLimitBuckets() {
  buckets.clear();
}
