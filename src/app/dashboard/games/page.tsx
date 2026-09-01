import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { GamesClient } from "@/components/games/GamesClient";
import { getProgressSummary } from "@/services/gamification.service";

export default async function GamesPage() {
  const user = await requireUser();
  let initial = null;
  let headerIdentity: {
    displayName: string | null;
    avatarPresetId: string | null;
    avatarStatus: string | null;
  } = {
    displayName: null,
    avatarPresetId: null,
    avatarStatus: null,
  };
  try {
    const summary = await getProgressSummary(user.id);
    headerIdentity = {
      displayName: summary.displayName,
      avatarPresetId: summary.avatarPresetId,
      avatarStatus: summary.avatarStatus,
    };
    initial = {
      xpTotal: summary.xpTotal,
      level: summary.level,
      levelName: summary.levelName,
      academicAura: summary.academicAura,
      streak: {
        current: summary.streak.current,
        best: summary.streak.best,
      },
      quests: summary.quests.map((q) => ({
        id: q.id,
        title: q.title,
        status: q.status,
        xpReward: q.xpReward,
      })),
    };
  } catch {
    initial = null;
  }

  return (
    <AppShell
      title="Games & Streaks"
      subtitle="Focus Sprint · Quiz Rush · Flashcards · XP"
      titleKey="games.title"
      subtitleKey="games.subtitle"
      userName={user.name ?? "Student"}
      displayName={headerIdentity.displayName}
      avatarPresetId={headerIdentity.avatarPresetId}
      avatarStatus={headerIdentity.avatarStatus}
    >
      <GamesClient initialSummary={initial} />
    </AppShell>
  );
}
