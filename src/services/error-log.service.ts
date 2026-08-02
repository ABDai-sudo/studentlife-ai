import { prisma } from "@/lib/db";
import { safeLog } from "@/lib/security/safe-log";

export async function recordAppError(input: {
  requestId?: string | null;
  route?: string | null;
  method?: string | null;
  statusCode?: number | null;
  errorCode: string;
  category?: string;
  messageSafe: string;
  durationMs?: number | null;
  userId?: string | null;
}): Promise<void> {
  try {
    await prisma.appErrorLog.create({
      data: {
        requestId: input.requestId ?? null,
        route: input.route ?? null,
        method: input.method ?? null,
        statusCode: input.statusCode ?? null,
        errorCode: input.errorCode,
        category: input.category ?? "app",
        messageSafe: input.messageSafe.slice(0, 500),
        durationMs: input.durationMs ?? null,
        userId: input.userId ?? null,
        environment: process.env.NODE_ENV ?? "development",
      },
    });
  } catch (error) {
    safeLog("warn", "Error log write failed", { error: String(error) });
  }
}
