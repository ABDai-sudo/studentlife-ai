import { prisma } from "@/lib/db";
import { features } from "@/lib/features";
import { enqueueInAppNotification } from "@/services/notification.service";
import { dayKeyInTz } from "@/services/gamification.service";
import { getDashboardMoneySummary } from "@/services/expense.service";
import { listGoalsForUser } from "@/services/goal.service";

/**
 * Privacy-safe money alerts foundation ("Smart Money Alerts" / "Wallet Survival Mode").
 * Never surfaces financial data on leaderboards or social feeds.
 * Guidance only — not banking, credit, investment, or professional financial advice.
 * Uses only student-logged budget/expense/savings data.
 */
export async function evaluateMoneyGuardianAlerts(userId: string) {
  if (!features.moneyGuardianAlerts) return [];

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });
  if (prefs?.pauseAll) return [];

  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) return [];

  const summary = await getDashboardMoneySummary(userId);
  const day = dayKeyInTz(profile.timezone);
  const monthKey = day.slice(0, 7);
  const currency = profile.currency || "INR";
  const created = [];

  if (
    prefs?.safeSpendUpdate !== false &&
    prefs?.overspending !== false &&
    summary.safePerDay != null &&
    summary.moneyLeft != null &&
    summary.pocketMoney != null &&
    summary.pocketMoney > 0
  ) {
    const baseline =
      summary.pocketMoney /
      Math.max(1, summary.daysLeft + (30 - summary.daysLeft));
    if (summary.safePerDay < baseline * 0.55 && summary.monthSpent > 0) {
      const n = await enqueueInAppNotification({
        userId,
        category: "SAFE_SPEND_UPDATE",
        title: "Safe daily spend dropped",
        body: `Your safe daily spend has dropped to ${currency} ${summary.safePerDay.toFixed(0)} for the rest of the month, based on expenses you logged. Guidance only.`,
        href: "/dashboard/money",
        idempotencyKey: `safe-drop:${userId}:${monthKey}`,
      });
      if (n) created.push(n);
    }
  }

  if (
    prefs?.overspending !== false &&
    summary.safePerDay != null &&
    summary.todaySpent > summary.safePerDay
  ) {
    const n = await enqueueInAppNotification({
      userId,
      category: "OVERSPENDING",
      title: "Safe daily spend exceeded",
      body: `Today's logged spending is above your safe daily amount of ${currency} ${summary.safePerDay.toFixed(0)}. Review expenses to protect the rest of the month. This is budgeting guidance only.`,
      href: "/dashboard/money",
      idempotencyKey: `overspend:${userId}:${day}`,
    });
    if (n) created.push(n);
  }

  if (
    prefs?.lowMoney !== false &&
    summary.moneyLeft != null &&
    summary.daysLeft >= 3 &&
    summary.monthSpent > 0 &&
    summary.pocketMoney != null &&
    summary.pocketMoney > 0
  ) {
    const daysElapsed = Math.max(1, 30 - summary.daysLeft);
    const dailyAvg = summary.monthSpent / daysElapsed;
    const projected = dailyAvg * summary.daysLeft;
    if (projected > summary.moneyLeft * 1.15) {
      const n = await enqueueInAppNotification({
        userId,
        category: "LOW_MONEY",
        title: "Spending rate may run ahead",
        body: "Based on your current spending rate, available money may run short before month-end. This is an estimate from your logged expenses — not financial advice.",
        href: "/dashboard/money",
        idempotencyKey: `shortage:${userId}:${monthKey}`,
      });
      if (n) created.push(n);
    }
  }

  if (prefs?.savingsGoal !== false) {
    const goals = await listGoalsForUser(userId);
    for (const g of goals) {
      if (g.status === "COMPLETED" || g.progressPercent >= 100) {
        const n = await enqueueInAppNotification({
          userId,
          category: "SAVINGS_GOAL",
          title: "Savings milestone reached",
          body: `You reached your "${g.title}" savings target of ${g.currency} ${g.targetAmount.toFixed(0)} from amounts you logged. Guidance only.`,
          href: "/dashboard/goals",
          idempotencyKey: `goal-done:${userId}:${g.id}`,
        });
        if (n) created.push(n);
        continue;
      }
      if (g.progressPercent >= 80 && g.progressPercent < 100) {
        const remaining = Math.max(0, g.targetAmount - g.currentAmount);
        const n = await enqueueInAppNotification({
          userId,
          category: "SAVINGS_GOAL",
          title: "Close to a savings milestone",
          body: `You're ${g.currency} ${remaining.toFixed(0)} away from your "${g.title}" savings milestone, based on progress you logged.`,
          href: "/dashboard/goals",
          idempotencyKey: `goal-near:${userId}:${g.id}:${monthKey}`,
        });
        if (n) created.push(n);
      }
    }
  }

  if (summary.pocketMoney == null || summary.pocketMoney <= 0) {
    return created;
  }

  const warnAt = prefs?.categoryWarnPercent ?? 70;
  const highAt = prefs?.categoryHighPercent ?? 90;

  for (const cat of summary.categories) {
    if (prefs?.overspending === false) break;
    const pct = Math.round((cat.amount / summary.pocketMoney) * 100);

    if (pct >= 100) {
      const n = await enqueueInAppNotification({
        userId,
        category: "OVERSPENDING",
        title: "Category budget reached",
        body: `${cat.category} spending has reached about ${pct}% of your monthly pocket money plan. This is guidance only.`,
        href: "/dashboard/expenses",
        idempotencyKey: `cat-100:${userId}:${cat.category}:${monthKey}`,
      });
      if (n) created.push(n);
    } else if (pct >= highAt) {
      const n = await enqueueInAppNotification({
        userId,
        category: "OVERSPENDING",
        title: "High-risk category spending",
        body: `${cat.category} spending has reached ${pct}% of your pocket money plan. Consider slowing down in this category.`,
        href: "/dashboard/expenses",
        idempotencyKey: `cat-high:${userId}:${cat.category}:${monthKey}`,
      });
      if (n) created.push(n);
    } else if (pct >= warnAt) {
      const n = await enqueueInAppNotification({
        userId,
        category: "OVERSPENDING",
        title: "Category spending warning",
        body: `${cat.category} spending has reached ${pct}% of the category budget against your pocket money plan. Early awareness helps the month last.`,
        href: "/dashboard/expenses",
        idempotencyKey: `cat-warn:${userId}:${cat.category}:${monthKey}`,
      });
      if (n) created.push(n);
    }
  }

  return created;
}
