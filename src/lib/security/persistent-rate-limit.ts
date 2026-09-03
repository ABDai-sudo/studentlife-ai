import { isTransientDbError, prisma, withDbRetry } from "@/lib/db";
import { decideRateLimit, type RateLimitResult } from "@/lib/security/rate-limit";
import { safeLog } from "@/lib/security/safe-log";

type BucketRow = { count: number; reset_at: Date };

let ensurePromise: Promise<void> | null = null;

async function ensureRateLimitTable() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
          "key" TEXT NOT NULL,
          "count" INTEGER NOT NULL DEFAULT 0,
          "reset_at" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "rate_limit_buckets_reset_at_idx"
          ON "rate_limit_buckets"("reset_at")
      `);
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  return ensurePromise;
}

function isMissingTable(error: unknown): boolean {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);
  return (
    code === "P2021" ||
    code === "42P01" ||
    /rate_limit_buckets/i.test(message)
  );
}

/**
 * Postgres-backed limiter for serverless (Vercel) + Neon.
 * Uses SELECT FOR UPDATE so concurrent instances share one counter.
 * Transient Neon disconnects are retried, then fail closed.
 * Non-transient DB errors are logged and rethrown so they are not disguised as 429.
 */
export async function persistentRateLimit(
  key: string,
  options: { limit: number; windowSec: number }
): Promise<RateLimitResult> {
  const { limit, windowSec } = options;
  const now = Date.now();

  async function run(): Promise<RateLimitResult> {
    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<BucketRow[]>`
        SELECT count, reset_at
        FROM rate_limit_buckets
        WHERE key = ${key}
        FOR UPDATE
      `;
      const row = rows[0];
      const existing = row
        ? { count: row.count, resetAt: row.reset_at.getTime() }
        : null;
      const decision = decideRateLimit(existing, now, limit, windowSec);
      if (decision.mutated) {
        const resetAt = new Date(decision.next.resetAt);
        await tx.$executeRaw`
          INSERT INTO rate_limit_buckets (key, count, reset_at)
          VALUES (${key}, ${decision.next.count}, ${resetAt})
          ON CONFLICT (key) DO UPDATE
          SET count = EXCLUDED.count, reset_at = EXCLUDED.reset_at
        `;
      }
      return {
        allowed: decision.allowed,
        remaining: decision.remaining,
        retryAfterSec: decision.retryAfterSec,
      };
    });
  }

  try {
    return await withDbRetry(() => run());
  } catch (error) {
    if (isMissingTable(error)) {
      await ensureRateLimitTable();
      return withDbRetry(() => run());
    }
    safeLog("error", "Persistent rate limit failed", { error: String(error) });
    if (isTransientDbError(error)) {
      return { allowed: false, remaining: 0, retryAfterSec: windowSec };
    }
    throw error;
  }
}
