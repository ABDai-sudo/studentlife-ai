import "dotenv/config";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "@/lib/db";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { resolveActiveSession } from "@/lib/auth/active-session";
import { hashToken } from "@/lib/security/hash";

const hasDb = Boolean(process.env.DATABASE_URL);

describe("session revocation", { skip: !hasDb }, () => {
  it("rejects a revoked token and accepts a later login token", async () => {
    const email = `revoke-${Date.now()}@studentlife.test`;
    const user = await prisma.user.create({
      data: { email, passwordHash: "not-used", name: "Revoke" },
    });
    try {
      const token = await createSessionToken({ userId: user.id, email });
      await prisma.authSession.create({
        data: {
          userId: user.id,
          sessionTokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 86_400_000),
        },
      });

      assert.equal((await resolveActiveSession(token))?.userId, user.id);
      assert.ok(await verifySessionToken(token));

      await prisma.authSession.updateMany({
        where: { sessionTokenHash: hashToken(token) },
        data: { revokedAt: new Date() },
      });

      assert.equal(await resolveActiveSession(token), null);
      assert.ok(await verifySessionToken(token));

      const next = await createSessionToken({ userId: user.id, email });
      await prisma.authSession.create({
        data: {
          userId: user.id,
          sessionTokenHash: hashToken(next),
          expiresAt: new Date(Date.now() + 86_400_000),
        },
      });
      assert.equal((await resolveActiveSession(next))?.userId, user.id);
      assert.equal(await resolveActiveSession(token), null);
    } finally {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    }
  });
});
