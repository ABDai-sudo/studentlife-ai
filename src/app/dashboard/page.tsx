import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { getDashboardMoneySummary } from "@/services/expense.service";
import { getProgressSummary } from "@/services/gamification.service";
import { getAvatarCardContext } from "@/services/avatar-context.service";
import { resolveBudgetState } from "@/lib/avatar/budget-state";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";
import {
  DashboardGamificationHeader,
  type GamificationSummary,
} from "@/components/dashboard/DashboardGamificationHeader";
import { DashboardMoneyOverview } from "@/components/dashboard/DashboardMoneyOverview";
import { runEngagementTick } from "@/services/engagement-tick.service";
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

  let summary: Awaited<ReturnType<typeof getDashboardMoneySummary>> | null =
    null;
  try {
    summary = await getDashboardMoneySummary(user.id);
  } catch {
    summary = null;
  }

  let progress: GamificationSummary | null = null;
  let progressError: string | null = null;
  try {
    const raw = await getProgressSummary(user.id);
    progress = toClientSummary(raw);
    void runEngagementTick(user.id).catch(() => undefined);
  } catch {
    progressError = "Could not load progress.";
  }

  let avatarSignals = {
    institutionName: null as string | null,
    examSeasonActive: false,
    hasModelPapers: false,
    seed: user.id,
  };
  try {
    avatarSignals = await getAvatarCardContext(user.id);
  } catch {
    avatarSignals = { ...avatarSignals, seed: user.id };
  }

  const avatarContext: AvatarCardContextView = {
    budget: resolveBudgetState({
      pocketMoney: summary?.pocketMoney ?? null,
      moneyLeft: summary?.moneyLeft ?? null,
      monthSpent: summary?.monthSpent,
    }),
    examSeasonActive: avatarSignals.examSeasonActive,
    institutionName: avatarSignals.institutionName,
    hasModelPapers: avatarSignals.hasModelPapers,
    seed: avatarSignals.seed,
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

  return (
    <AppShell
      title="Dashboard"
      subtitle="Study tools · money · progress"
      titleKey="nav.overview"
      subtitleKey="dashboard.subtitle"
      userName={user.name ?? firstName}
      displayName={progress?.displayName}
      avatarPresetId={progress?.avatarPresetId}
      avatarStatus={progress?.avatarStatus}
      avatarPresence={progress?.avatarPresence}
    >
      <DashboardGamificationHeader
        userName={user.name ?? firstName}
        initialData={progress}
        loadError={progressError}
        avatarContext={avatarContext}
      />
      <DashboardMoneyOverview summary={view} />
    </AppShell>
  );
}
