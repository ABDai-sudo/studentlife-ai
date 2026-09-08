import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { getDashboardMoneySummary } from "@/services/expense.service";
import { getProgressSummary } from "@/services/gamification.service";
import { getAvatarCardContext } from "@/services/avatar-context.service";
import { getDashboardFocus } from "@/services/dashboard-focus.service";
import { resolveBudgetState } from "@/lib/avatar/budget-state";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";
import {
  DashboardGamificationHeader,
  type GamificationSummary,
} from "@/components/dashboard/DashboardGamificationHeader";
import { DashboardMoneyOverview } from "@/components/dashboard/DashboardMoneyOverview";
import { DashboardFocusStrip } from "@/components/dashboard/DashboardFocusStrip";
import { runEngagementTick } from "@/services/engagement-tick.service";
import { trackAnalyticsEvent } from "@/services/analytics.service";
import { withDbRetry } from "@/lib/db";
import type { AvatarCardContextView } from "@/components/avatar/AvatarStatusCard";

function categoryLabel(category: string) {
  return (
    EXPENSE_CATEGORY_LABELS[
      category as keyof typeof EXPENSE_CATEGORY_LABELS
    ] ?? category
  );
}

function toClientSummary(
  summary: Awaited<ReturnType<typeof getProgressSummary>>
): GamificationSummary {
  return {
    xpTotal: summary.xpTotal,
    level: summary.level,
    levelName: summary.levelName,
    xpToNext: summary.xpToNext,
    levelProgress: summary.levelProgress,
    academicAura: summary.academicAura,
    displayName: summary.displayName,
    avatarPresetId: summary.avatarPresetId,
    avatarImageUrl: summary.avatarImageUrl,
    avatarStatus: summary.avatarStatus,
    avatarPresence: summary.avatarPresence,
    avatarStatusSource: summary.avatarStatusSource,
    avatarStatusLive: summary.avatarStatusLive,
    avatarFrameUi: summary.avatarFrameUi,
    todayComplete: summary.todayComplete,
    questsDone: summary.questsDone,
    questsTotal: summary.questsTotal,
    streak: {
      current: summary.streak.current,
      best: summary.streak.best,
      lastLoggedAt: summary.streak.lastLoggedAt
        ? new Date(summary.streak.lastLoggedAt).toISOString()
        : null,
    },
    quests: summary.quests.map((q) => ({
      id: q.id,
      title: q.title,
      status: q.status,
      xpReward: q.xpReward,
    })),
  };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name?.split(" ")[0] ?? "there";

  const [summary, progressRaw, avatarSignals, focus] = await Promise.all([
    withDbRetry(() => getDashboardMoneySummary(user.id)).catch(() => null),
    withDbRetry(() => getProgressSummary(user.id)).catch(() => null),
    withDbRetry(() => getAvatarCardContext(user.id)).catch(() => null),
    withDbRetry(() => getDashboardFocus(user.id)).catch(() => null),
  ]);

  let progress: GamificationSummary | null = null;
  let progressError: string | null = null;
  if (progressRaw) {
    progress = toClientSummary(progressRaw);
    void runEngagementTick(user.id).catch(() => undefined);
  } else {
    progressError = "load";
  }

  void trackAnalyticsEvent({ eventName: "dashboard_opened" }, user.id);

  const avatarContext: AvatarCardContextView = {
    budget: resolveBudgetState({
      pocketMoney: summary?.pocketMoney ?? null,
      moneyLeft: summary?.moneyLeft ?? null,
      monthSpent: summary?.monthSpent,
    }),
    examSeasonActive: avatarSignals?.examSeasonActive ?? false,
    institutionName: avatarSignals?.institutionName ?? null,
    hasModelPapers: avatarSignals?.hasModelPapers ?? false,
    seed: avatarSignals?.seed ?? user.id,
  };

  const view = summary
    ? {
        currency: summary.currency,
        moneyLeft: summary.moneyLeft,
        pocketMoney: summary.pocketMoney,
        daysLeft: summary.daysLeft,
        safePerDay: summary.safePerDay,
        monthSpent: summary.monthSpent,
        todaySpent: summary.todaySpent,
        categories: summary.categories.map((c) => ({
          category: c.category,
          percent: c.percent,
          amount: c.amount,
          label: categoryLabel(c.category),
        })),
        recent: summary.recent.map((row) => ({
          id: row.id,
          description: row.description,
          categoryLabel: categoryLabel(row.category),
          amount: row.amount,
          currency: row.currency,
        })),
      }
    : null;

  const nextQuest =
    progress?.quests.find((q) => q.status !== "COMPLETED")?.title ?? null;

  return (
    <AppShell
      title="Dashboard"
      subtitle="Study tools · money · progress"
      titleKey="nav.overview"
      subtitleKey="dashboard.subtitle"
      userName={user.name ?? firstName}
      displayName={progress?.displayName}
      avatarPresetId={progress?.avatarPresetId}
      avatarImageUrl={progress?.avatarImageUrl}
      avatarStatus={progress?.avatarStatus}
      avatarPresence={progress?.avatarPresence}
    >
      <DashboardFocusStrip
        nextDeadline={focus?.nextDeadline ?? null}
        nextQuestTitle={nextQuest}
        todayComplete={progress?.todayComplete ?? false}
      />
      <DashboardGamificationHeader
        userName={user.name ?? firstName}
        initialData={progress}
        loadError={progressError}
        avatarContext={avatarContext}
      />
      <DashboardMoneyOverview summary={view} variant="snapshot" />
    </AppShell>
  );
}
