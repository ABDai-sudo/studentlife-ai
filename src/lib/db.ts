import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Neon cold starts and busy pools need more than Prisma's 10s default. */
export function resolveDatabaseUrl(raw = process.env.DATABASE_URL): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "30");
    }
    return url.href;
  } catch {
    return raw;
  }
}

function createPrismaClient() {
  const url = resolveDatabaseUrl();
  return new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Neon scale-to-zero and restarts surface as 57P01 / connection loss. */
export function isTransientDbError(error: unknown): boolean {
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

  const transientCodes = new Set([
    "57P01",
    "08006",
    "08003",
    "P1001",
    "P1002",
    "P1017",
  ]);

  if (transientCodes.has(code)) return true;

  const needles = [
    "terminating connection due to administrator command",
    "connection terminated unexpectedly",
    "can't reach database server",
    "server has closed the connection",
    "connection reset",
    "econnreset",
    "econnrefused",
    "connection timed out",
    "connect timeout",
  ];

  const lower = message.toLowerCase();
  return needles.some((n) => lower.includes(n));
}

/**
 * Retry a DB *read* after Neon idle/suspend disconnects.
 * Does not $disconnect the shared Prisma client (that aborts in-flight
 * requests on the same Node process). Prisma reconnects on the next query.
 * Do not wrap non-idempotent writes: a commit that then surfaces 57P01
 * would be applied twice.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  retries = 2
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      }
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === retries) {
        throw error;
      }
    }
  }

  throw lastError;
}

export default prisma;
