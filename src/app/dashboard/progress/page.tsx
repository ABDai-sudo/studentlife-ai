import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { ProgressClient } from "@/components/academics/ProgressClient";
import {
  GamificationPanel,
  type GamificationSummary,
} from "@/components/progress/GamificationPanel";
import { getProgressSummary } from "@/services/gamification.service";

function toClientSummary(
  summary: Awaited<ReturnType<typeof getProgressSummary>>
): GamificationSummary {
  return {
    xpTotal: summary.xpTotal,
    level: summary.level,
    levelName: summary.levelName,
    academicAura: summary.academicAura,
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
      description: q.description,
      status: q.status,
      xpReward: q.xpReward,
    })),
    challenges: summary.challenges.map((c) => ({
      id: c.id,
      title: c.title,
      progress: c.progress,
      target: c.target,
      status: c.status,
    })),
    achievements: summary.achievements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
    })),
  };
}

export default async function ProgressPage() {
  const user = await requireUser();
  let initialSummary: GamificationSummary | null = null;
  try {
    initialSummary = toClientSummary(await getProgressSummary(user.id));
  } catch {
    initialSummary = null;
  }

  return (
    <AppShell
      title="Progress"
      subtitle="XP, streaks, quests, attendance & CGPA"
      titleKey="progress.title"
      subtitleKey="progress.subtitle"
      userName={user.name ?? "Student"}
    >
      <div className="space-y-8">
        <GamificationPanel initialSummary={initialSummary} />
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Attendance & CGPA
          </h2>
          <ProgressClient />
        </div>
      </div>
    </AppShell>
  );
}
