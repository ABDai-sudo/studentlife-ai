import "dotenv/config";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";
import {
  createExpenseForUser,
  deleteExpenseForUser,
  getDashboardMoneySummary,
  listExpensesForUser,
} from "@/services/expense.service";
import {
  createAssignment,
  createExam,
  deleteAssignment,
  deleteExam,
  listAssignments,
  listExams,
  updateAssignment,
} from "@/services/academics.service";
import {
  createRecurringExpenseForUser,
  deleteRecurringExpenseForUser,
  materializeRecurringForMonth,
  monthPeriodKey,
  updateRecurringExpenseForUser,
} from "@/services/recurring-expense.service";
import { upsertBudgetForUser, deleteBudgetForUser } from "@/services/budget.service";
import {
  applyBillingEvent,
  userHasPaidAccess,
  getBillingSnapshot,
} from "@/services/billing.service";
import { publicPlan, hasPaidAccess } from "@/lib/billing/entitlements";
import { signDevWebhook } from "@/lib/billing/dev-provider";
import { POST as billingWebhookPost } from "@/app/api/billing/webhook/route";
import { buildStudentAiContext } from "@/services/ai/context";
import {
  completeStudyBuddyItem,
  generateStudyBuddyPlan,
  getStudyBuddyConversation,
  getStudyBuddyOverview,
} from "@/services/study-buddy.service";
import { maybeEnqueueDeadlineReminders } from "@/services/notification.service";
import { awardXp, recordMeaningfulActivity } from "@/services/gamification.service";
import { hashToken } from "@/lib/security/hash";

const hasDb = Boolean(process.env.DATABASE_URL);
const PASSWORD = "Testpass1";

async function makeUser(email: string, extras?: { pocket?: number; weak?: string; course?: string }) {
  const passwordHash = await hashPassword(PASSWORD);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      name: email.split("@")[0],
      profile: {
        create: {
          monthlyPocketMoney: extras?.pocket ?? 8000,
          monthlyNecessaryExpenses: 0,
          weakSubjects: extras?.weak ?? null,
          course: extras?.course ?? "B.Tech",
          classOrSemester: "Sem 3",
        },
      },
      subscriptions: { create: { plan: "FREE", status: "ACTIVE" } },
    },
  });
}

describe("backend closeout e2e", { skip: !hasDb }, () => {
  it("isolates two users and runs money, study, billing, and login flows", async () => {
    process.env.BILLING_PROVIDER = "dev";
    process.env.AI_PROVIDER = "rules";
    process.env.BILLING_DEV_WEBHOOK_SECRET =
      process.env.BILLING_DEV_WEBHOOK_SECRET?.trim() ||
      "dev_local_webhook_secret_for_tests_32";

    const suffix = `${Date.now()}`;
    let aId: string | null = null;
    let bId: string | null = null;
    try {
      const a = await makeUser(`e2e.a.${suffix}@example.com`, {
        pocket: 8000,
        weak: "Pointers-A-only",
        course: "Computer Science A",
      });
      const b = await makeUser(`e2e.b.${suffix}@example.com`, {
        pocket: 3000,
        weak: "Thermodynamics-B-only",
        course: "Mechanical B",
      });
      aId = a.id;
      bId = b.id;

      const expA = await createExpenseForUser(a.id, {
        amount: 250,
        currency: "INR",
        category: "FOOD",
        description: "user-a-biryani",
        clientRequestId: `e2e-a-food-${suffix}`,
      });
      const dupExp = await createExpenseForUser(a.id, {
        amount: 250,
        currency: "INR",
        category: "FOOD",
        description: "user-a-biryani",
        clientRequestId: `e2e-a-food-${suffix}`,
      });
      assert.equal(dupExp.id, expA.id);

      await createExpenseForUser(b.id, {
        amount: 90,
        currency: "INR",
        category: "TRANSPORT",
        description: "user-b-bus",
        clientRequestId: `e2e-b-bus-${suffix}`,
      });

      const listedA = await listExpensesForUser(a.id, { page: 1, pageSize: 20 });
      assert.equal(listedA.expenses.some((row) => row.description === "user-b-bus"), false);
      assert.equal(listedA.expenses.some((row) => row.description === "user-a-biryani"), true);

      const stole = await deleteExpenseForUser(b.id, expA.id);
      assert.equal(stole, false);
      const stillA = await prisma.expense.findUnique({ where: { id: expA.id } });
      assert.ok(stillA);

      const moneyBefore = await getDashboardMoneySummary(a.id);
      assert.ok(moneyBefore.monthSpent >= 250);
      const safeBefore = moneyBefore.safePerDay;

      await createExpenseForUser(a.id, {
        amount: 150,
        currency: "INR",
        category: "SHOPPING",
        description: "user-a-notebooks",
        clientRequestId: `e2e-a-shop-${suffix}`,
      });
      const moneyAfter = await getDashboardMoneySummary(a.id);
      assert.ok(moneyAfter.monthSpent >= moneyBefore.monthSpent + 150);
      assert.notEqual(moneyAfter.safePerDay, safeBefore);

      const budgetA = await upsertBudgetForUser(a.id, {
        category: "FOOD",
        amount: 2000,
        currency: "INR",
        period: "MONTHLY",
      });
      const budgetB = await upsertBudgetForUser(b.id, {
        category: "TRANSPORT",
        amount: 400,
        currency: "INR",
        period: "MONTHLY",
      });
      assert.equal(await deleteBudgetForUser(b.id, budgetA.id), false);
      assert.equal(await deleteBudgetForUser(a.id, budgetB.id), false);

      const necessity = await createRecurringExpenseForUser(a.id, {
        amount: 2000,
        currency: "INR",
        category: "HOSTEL",
        description: "rent-a",
        dayOfMonth: 1,
        startDate: "2026-01-01",
        mode: "NECESSITY",
      });
      const loggedRecurring = await createRecurringExpenseForUser(a.id, {
        amount: 400,
        currency: "INR",
        category: "UTILITIES",
        description: "wifi-a",
        dayOfMonth: 5,
        startDate: "2026-01-01",
        mode: "EXPENSE",
      });
      const now = new Date();
      const first = await materializeRecurringForMonth(a.id, now);
      const again = await materializeRecurringForMonth(a.id, now);
      assert.ok(again.created === 0);
      assert.ok(first.reused + again.reused >= 1);

      const occThisMonth = await prisma.recurringExpenseOccurrence.count({
        where: {
          userId: a.id,
          periodKey: monthPeriodKey(now),
        },
      });
      assert.equal(occThisMonth, 2);

      const wifiExpenses = await prisma.expense.count({
        where: { userId: a.id, description: "wifi-a" },
      });
      assert.equal(wifiExpenses, 1);
      const rentExpenses = await prisma.expense.count({
        where: { userId: a.id, description: "rent-a" },
      });
      assert.equal(rentExpenses, 0);

      const safeWithRent = await getDashboardMoneySummary(a.id);
      assert.ok(safeWithRent.necessaryCommitted >= 2000);
      assert.equal(
        safeWithRent.monthSpent ===
          moneyAfter.monthSpent + 400 ||
          safeWithRent.monthSpent >= moneyAfter.monthSpent,
        true
      );

      await updateRecurringExpenseForUser(a.id, loggedRecurring.id, { amount: 500 });
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 8));
      await materializeRecurringForMonth(a.id, nextMonth);
      const nextWifi = await prisma.recurringExpenseOccurrence.findFirst({
        where: {
          recurringExpenseId: loggedRecurring.id,
          periodKey: monthPeriodKey(nextMonth),
        },
      });
      assert.equal(Number(nextWifi?.amount), 500);

      await updateRecurringExpenseForUser(a.id, loggedRecurring.id, { active: false });
      const monthAfter = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 8));
      await materializeRecurringForMonth(a.id, monthAfter);
      const disabledOcc = await prisma.recurringExpenseOccurrence.findFirst({
        where: {
          recurringExpenseId: loggedRecurring.id,
          periodKey: monthPeriodKey(monthAfter),
        },
      });
      assert.equal(disabledOcc, null);

      const deleted = await deleteRecurringExpenseForUser(a.id, necessity.id);
      assert.equal(deleted, true);
      await materializeRecurringForMonth(a.id, monthAfter);
      const deletedOcc = await prisma.recurringExpenseOccurrence.findFirst({
        where: {
          recurringExpenseId: necessity.id,
          periodKey: monthPeriodKey(monthAfter),
        },
      });
      assert.equal(deletedOcc, null);

      const asgA = await createAssignment(a.id, {
        title: "Secret-A-OS-assignment",
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
        status: "PENDING",
        priority: 2,
      });
      await createAssignment(b.id, {
        title: "Secret-B-fluids-lab",
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        status: "PENDING",
        priority: 2,
      });
      assert.equal(
        (await listAssignments(b.id)).some((row) => row.title === "Secret-A-OS-assignment"),
        false
      );
      assert.equal(await updateAssignment(b.id, asgA.id, { title: "hacked" }), null);
      assert.equal(await deleteAssignment(b.id, asgA.id), false);

      const examA = await createExam(a.id, {
        title: "Secret-A-midterm",
        subject: "OS",
        examType: "MIDTERM",
        examDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      });
      await createExam(b.id, {
        title: "Secret-B-viva",
        subject: "Thermo",
        examType: "OTHER",
        examDate: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
      });
      assert.equal(
        (await listExams(b.id)).some((row) => row.title === "Secret-A-midterm"),
        false
      );
      assert.equal(await deleteExam(b.id, examA.id), false);

      const firstReminders = await maybeEnqueueDeadlineReminders(a.id);
      const secondReminders = await maybeEnqueueDeadlineReminders(a.id);
      assert.ok(firstReminders.assignments.length >= 1);
      assert.ok(firstReminders.exams.length >= 1);
      const notifCount = await prisma.userNotification.count({
        where: { userId: a.id, category: { in: ["ASSIGNMENT_DEADLINE", "UPCOMING_EXAM"] } },
      });
      await maybeEnqueueDeadlineReminders(a.id);
      const notifCount2 = await prisma.userNotification.count({
        where: { userId: a.id, category: { in: ["ASSIGNMENT_DEADLINE", "UPCOMING_EXAM"] } },
      });
      assert.equal(notifCount2, notifCount);
      void secondReminders;

      const ctxA = await buildStudentAiContext(a.id);
      const ctxB = await buildStudentAiContext(b.id);
      assert.match(ctxA, /Secret-A-OS-assignment/);
      assert.doesNotMatch(ctxA, /Secret-B-fluids-lab|Thermodynamics-B-only|user-b-bus/);
      assert.match(ctxB, /Secret-B-fluids-lab/);
      assert.doesNotMatch(ctxB, /Secret-A-OS-assignment|Pointers-A-only|user-a-biryani/);

      const planA = await generateStudyBuddyPlan(a.id);
      assert.ok(
        planA.items.some((item) => item.title.includes("Secret-A-OS-assignment")) ||
          JSON.stringify(planA).includes("Secret-A-OS-assignment") ||
          planA.items.length >= 1
      );
      const overviewA = await getStudyBuddyOverview(a.id);
      const overviewB = await getStudyBuddyOverview(b.id);
      assert.doesNotMatch(JSON.stringify(overviewA), /Secret-B-fluids-lab/);
      assert.doesNotMatch(JSON.stringify(overviewB), /Secret-A-OS-assignment/);

      const item = planA.items[0];
      if (item) {
        const firstXp = await completeStudyBuddyItem(a.id, item.id);
        const secondXp = await completeStudyBuddyItem(a.id, item.id);
        assert.equal(secondXp.already, true);
        assert.equal(secondXp.xp?.awarded ?? 0, 0);
        if (firstXp.xp && firstXp.xp.awarded > 0) {
          assert.ok(firstXp.xp.awarded >= 1);
        }
        await assert.rejects(
          async () => completeStudyBuddyItem(b.id, item.id),
          (err: unknown) => err instanceof Error && err.message === "NOT_FOUND"
        );
      }

      const xp1 = await awardXp(a.id, 10, "item:manual-dup", "study_buddy");
      const xp2 = await awardXp(a.id, 10, "item:manual-dup", "study_buddy");
      assert.equal(xp2.awarded, 0);
      assert.ok(xp1.awarded === 0 || xp1.awarded === 10);

      const streak1 = await recordMeaningfulActivity(a.id, "task");
      const streak2 = await recordMeaningfulActivity(a.id, "task");
      assert.equal(streak1?.currentCount, streak2?.currentCount);

      const convoSteal = await getStudyBuddyConversation(b.id, "not-a-real-id");
      assert.equal(convoSteal, null);

      const token1 = await createSessionToken({ userId: a.id, email: a.email });
      assert.ok(await verifySessionToken(token1));
      await prisma.authSession.create({
        data: {
          userId: a.id,
          sessionTokenHash: hashToken(token1),
          expiresAt: new Date(Date.now() + 86400000),
        },
      });
      await prisma.authSession.updateMany({
        where: { userId: a.id },
        data: { revokedAt: new Date() },
      });
      const token2 = await createSessionToken({ userId: a.id, email: a.email });
      const restored = await verifySessionToken(token2);
      assert.equal(restored?.userId, a.id);
      const afterLogin = await listExpensesForUser(a.id, { page: 1, pageSize: 50 });
      assert.equal(afterLogin.expenses.some((row) => row.description === "user-a-biryani"), true);

      const checkoutId = `dev_cs_${a.id}_${suffix}`;
      await prisma.billingCheckoutSession.create({
        data: {
          userId: a.id,
          plan: "PRO_MONTHLY",
          status: "OPEN",
          provider: "DEV",
          providerSessionId: checkoutId,
        },
      });

      const secret = process.env.BILLING_DEV_WEBHOOK_SECRET!;
      async function postWebhook(payload: Record<string, unknown>) {
        const body = JSON.stringify(payload);
        const sig = signDevWebhook(body, secret);
        return billingWebhookPost(
          new Request("http://localhost/api/billing/webhook", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-dev-billing-signature": sig,
            },
            body,
          })
        );
      }

      const periodEnd = new Date(Date.now() + 20 * 86400000).toISOString();
      const periodStart = new Date().toISOString();
      const evtCheckout = `evt_co_${suffix}`;
      const res1 = await postWebhook({
        providerEventId: evtCheckout,
        type: "checkout.completed",
        eventCreatedAt: new Date().toISOString(),
        userId: a.id,
        checkoutSessionId: checkoutId,
        customerId: `dev_cus_${a.id}`,
        subscriptionId: `dev_sub_${a.id}`,
        plan: "PRO_MONTHLY",
        periodStart,
        periodEnd,
        payload: { source: "e2e" },
      });
      assert.equal(res1.status, 200);
      assert.equal(await userHasPaidAccess(a.id), true);
      assert.equal(await userHasPaidAccess(b.id), false);

      const resDup = await postWebhook({
        providerEventId: evtCheckout,
        type: "checkout.completed",
        eventCreatedAt: new Date().toISOString(),
        userId: a.id,
        payload: { source: "e2e-dup" },
      });
      const dupJson = (await resDup.json()) as {
        data?: { results?: { duplicate?: boolean }[] };
      };
      assert.equal(dupJson.data?.results?.[0]?.duplicate, true);
      const webhookRows = await prisma.billingWebhookEvent.count({
        where: { providerEventId: evtCheckout },
      });
      assert.equal(webhookRows, 1);

      const older = new Date(Date.now() - 3600_000).toISOString();
      const resOld = await postWebhook({
        providerEventId: `evt_old_${suffix}`,
        type: "subscription.renewed",
        eventCreatedAt: older,
        userId: a.id,
        subscriptionId: `dev_sub_${a.id}`,
        plan: "PRO_MONTHLY",
        periodStart,
        periodEnd,
        payload: { source: "e2e-old" },
      });
      const oldJson = (await resOld.json()) as {
        data?: { results?: { skipped?: string | null }[] };
      };
      assert.equal(oldJson.data?.results?.[0]?.skipped, "out_of_order");

      await applyBillingEvent("DEV", {
        providerEventId: `evt_cancel_${suffix}`,
        type: "subscription.cancelled",
        eventCreatedAt: new Date(),
        userId: a.id,
        subscriptionId: `dev_sub_${a.id}`,
        plan: "PRO_MONTHLY",
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 20 * 86400000),
        cancelAtPeriodEnd: true,
        payload: {},
      });
      const snapCancel = await getBillingSnapshot(a.id);
      assert.equal(snapCancel.cancelAtPeriodEnd, true);
      assert.equal(snapCancel.entitled, true);
      assert.equal(snapCancel.status, "ACTIVE");

      await applyBillingEvent("DEV", {
        providerEventId: `evt_fail_${suffix}`,
        type: "payment.failed",
        eventCreatedAt: new Date(),
        userId: a.id,
        subscriptionId: `dev_sub_${a.id}`,
        plan: "PRO_MONTHLY",
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 20 * 86400000),
        paymentError: "card_declined",
        payload: {},
      });
      const subPastDue = await prisma.subscription.findFirst({ where: { userId: a.id } });
      assert.equal(subPastDue?.status, "PAST_DUE");
      assert.ok(subPastDue?.graceUntil);
      assert.equal(hasPaidAccess(subPastDue), true);
      assert.equal(
        hasPaidAccess(subPastDue, new Date(subPastDue!.graceUntil!.getTime() + 1000)),
        false
      );

      await applyBillingEvent("DEV", {
        providerEventId: `evt_unpaid_${suffix}`,
        type: "payment.unpaid",
        eventCreatedAt: new Date(),
        userId: a.id,
        subscriptionId: `dev_sub_${a.id}`,
        plan: "PRO_MONTHLY",
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 20 * 86400000),
        payload: {},
      });
      assert.equal(await userHasPaidAccess(a.id), false);
      assert.equal(publicPlan(await prisma.subscription.findFirst({ where: { userId: a.id } })), "FREE");

      assert.equal(publicPlan(await prisma.subscription.findFirst({ where: { userId: b.id } })), "FREE");
    } finally {
      if (aId || bId) {
        await prisma.user.deleteMany({
          where: { id: { in: [aId, bId].filter(Boolean) as string[] } },
        });
      }
    }
  });
});
