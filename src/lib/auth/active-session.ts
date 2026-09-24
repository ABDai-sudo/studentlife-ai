import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/security/hash";
import { verifySessionToken, type SessionPayload } from "@/lib/auth/session";

/**
 * A JWT is not enough. The matching auth_sessions row must exist,
 * belong to the same user, and be unexpired and unrevoked.
 * Database failures propagate so callers do not treat an outage as a valid login.
 */
export async function resolveActiveSession(
  token: string
): Promise<SessionPayload | null> {
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const row = await prisma.authSession.findUnique({
    where: { sessionTokenHash: hashToken(token) },
    select: { userId: true, revokedAt: true, expiresAt: true },
  });
  if (!row) return null;
  if (row.revokedAt) return null;
  if (row.userId !== payload.userId) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;
  return payload;
}
