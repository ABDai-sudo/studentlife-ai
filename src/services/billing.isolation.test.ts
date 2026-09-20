import "dotenv/config";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createExpenseForUser, listExpensesForUser } from "@/services/expense.service";
import { listAssignments } from "@/services/academics.service";
import { applyBillingEvent } from "@/services/billing.service";
import { publicPlan } from "@/lib/billing/entitlements";

const hasDb = Boolean(process.env.DATABASE_URL);

function isPendingMigration(error: unknown): boolean {
  const msg = String(error);
  return (
    msg.includes("does not exist") ||
    msg.includes("cancel_at_period_end") ||
    msg.includes("billing_webhook_events")
  );
}

describe("two-user data isolation", { skip: !hasDb }, () => {
  it("keeps expenses, assignments, and billing events on the owning user", async (t) => {
    const suffix = `${Date.now()}`;
    const passwordHash = await hashPassword("Testpass1");
    let aId: string | null = null;
    let bId: string | null = null;
    try {
      const a = await prisma.user.create({
        data: {
          email: `iso.a.${suffix}@example.com`,
          passwordHash,
          name: "Iso A",
          profile: { create: {} },
          subscriptions: { create: { plan: "FREE", status: "ACTIVE" } },
        },
      });
      aId = a.id;
      const b = await prisma.user.create({
        data: {
          email: `iso.b.${suffix}@example.com`,
          passwordHash,
          name: "Iso B",
          profile: { create: {} },
          subscriptions: { create: { plan: "FREE", status: "ACTIVE" } },
        },
      });
      bId = b.id;

      const expA = await createExpenseForUser(a.id, {
        amount: 120,
        currency: "INR",
        category: "FOOD",
        description: "user-a-only",
        clientRequestId: `iso-a-${suffix}`,
      });
      await createExpenseForUser(b.id, {
        amount: 80,
        currency: "INR",
        category: "TRANSPORT",
        description: "user-b-only",
        clientRequestId: `iso-b-${suffix}`,
      });
      const dup = await createExpenseForUser(a.id, {
        amount: 120,
        currency: "INR",
        category: "FOOD",
        description: "user-a-only",
        clientRequestId: `iso-a-${suffix}`,
      });
      assert.equal(dup.id, expA.id);

      const listedA = await listExpensesForUser(a.id, { page: 1, pageSize: 20 });
      assert.equal(listedA.expenses.some((row) => row.description === "user-b-only"), false);
      assert.equal(listedA.expenses.some((row) => row.description === "user-a-only"), true);

      await prisma.assignment.create({
        data: {
          userId: a.id,
          title: "A secret assignment",
          dueDate: new Date(),
          status: "PENDING",
        },
      });
      const bAssignments = await listAssignments(b.id);
      assert.equal(
        bAssignments.some((row) => row.title === "A secret assignment"),
        false
      );

      const first = await applyBillingEvent("DEV", {
        providerEventId: `iso-evt-${suffix}`,
        type: "checkout.completed",
        eventCreatedAt: new Date(),
        userId: a.id,
        checkoutSessionId: `iso-cs-${suffix}`,
        customerId: `iso-cus-${a.id}`,
        subscriptionId: `iso-sub-${a.id}`,
        plan: "PRO_MONTHLY",
        payload: { test: true },
      });
      const second = await applyBillingEvent("DEV", {
        providerEventId: `iso-evt-${suffix}`,
        type: "checkout.completed",
        eventCreatedAt: new Date(),
        userId: a.id,
        payload: { test: true },
      });
      assert.equal(first.duplicate, false);
      assert.equal(second.duplicate, true);

      const subA = await prisma.subscription.findFirst({
        where: { userId: a.id },
        orderBy: { updatedAt: "desc" },
      });
      const subB = await prisma.subscription.findFirst({
        where: { userId: b.id },
        orderBy: { updatedAt: "desc" },
      });
      assert.equal(publicPlan(subA), "PRO_MONTHLY");
      assert.equal(publicPlan(subB), "FREE");
    } catch (error) {
      if (isPendingMigration(error)) {
        t.skip("Additive billing migration is not applied to this database yet.");
        return;
      }
      throw error;
    } finally {
      if (aId || bId) {
        await prisma.user.deleteMany({
          where: { id: { in: [aId, bId].filter(Boolean) as string[] } },
        });
      }
    }
  });
});
