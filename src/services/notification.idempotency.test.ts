import "dotenv/config";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "@/lib/db";
import { enqueueInAppNotification } from "@/services/notification.service";

const hasDb = Boolean(process.env.DATABASE_URL);

describe("notification idempotency", { skip: !hasDb }, () => {
  it("keeps one row when the same key is inserted concurrently", async () => {
    const email = `notify-${Date.now()}@studentlife.test`;
    const user = await prisma.user.create({
      data: { email, passwordHash: "not-used", name: "Notify" },
    });
    const key = `closeout:${user.id}`;
    const logs: string[] = [];
    const origErr = console.error;
    const origWrite = process.stderr.write.bind(process.stderr);
    console.error = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
      origErr(...args);
    };
    process.stderr.write = ((chunk: string | Uint8Array) => {
      logs.push(String(chunk));
      return origWrite(chunk);
    }) as typeof process.stderr.write;

    try {
      await Promise.all(
        Array.from({ length: 8 }, () =>
          enqueueInAppNotification({
            userId: user.id,
            category: "PRODUCT",
            title: "Reminder",
            body: "One reminder",
            idempotencyKey: key,
          })
        )
      );
      const count = await prisma.userNotification.count({
        where: { userId: user.id, idempotencyKey: key },
      });
      assert.equal(count, 1);
      assert.equal(
        logs.some((line) => /Unique constraint failed/i.test(line)),
        false
      );
    } finally {
      console.error = origErr;
      process.stderr.write = origWrite;
      await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    }
  });
});
