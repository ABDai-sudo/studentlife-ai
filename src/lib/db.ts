import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
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
    "timed out",
  ];

  const lower = message.toLowerCase();
  return needles.some((n) => lower.includes(n));
}

/**
 * Run a DB operation with one reconnect retry for Neon idle/suspend errors.
 * Does not reset or migrate the database.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  retries = 2
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        try {
          await prisma.$disconnect();
        } catch {
          // ignore disconnect failures on a dead connection
        }
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
        await prisma.$connect();
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
