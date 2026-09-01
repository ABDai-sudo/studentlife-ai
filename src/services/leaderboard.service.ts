import { prisma } from "@/lib/db";
import { features } from "@/lib/features";
import { getAvatarPreset } from "@/lib/avatar/presets";

export type LeaderboardEntry = {
  rank: number;
  displayName: string;
  streakCurrent: number;
  xpTotal: number;
  academicAura: number;
  avatarPresetId: string | null;
  showAvatar: boolean;
  isYou: boolean;
};

/**
 * Global leaderboard from REAL opted-in users only.
 * Ranking: streak → XP → academic aura.
 * Never exposes email, userId, money, or private academic data.
 */
export async function getGlobalLeaderboard(viewerUserId: string, take = 50) {
  if (!features.leaderboard) {
    return {
      enabled: false as const,
      entries: [] as LeaderboardEntry[],
      viewer: null as LeaderboardEntry | null,
      totalOptedIn: 0,
    };
  }

  const profiles = await prisma.studentProfile.findMany({
    where: { leaderboardOptIn: true },
    select: {
      userId: true,
      displayName: true,
      xpTotal: true,
      academicAura: true,
      avatarPresetId: true,
      leaderboardShowAvatar: true,
      user: { select: { name: true } },
    },
  });

  const userIds = profiles.map((p) => p.userId);
  const streaks = userIds.length
    ? await prisma.streak.findMany({
        where: { userId: { in: userIds }, type: "study" },
        select: { userId: true, currentCount: true },
      })
    : [];
  const streakMap = new Map(streaks.map((s) => [s.userId, s.currentCount]));

  const ranked = profiles
    .map((p) => {
      const streakCurrent = streakMap.get(p.userId) ?? 0;
      const displayName =
        p.displayName?.trim() ||
        p.user.name?.trim()?.split(" ")[0] ||
        "Student";
      return {
        userId: p.userId,
        displayName,
        streakCurrent,
        xpTotal: p.xpTotal,
        academicAura: p.academicAura,
        avatarPresetId: p.avatarPresetId,
        showAvatar: p.leaderboardShowAvatar,
      };
    })
    .sort((a, b) => {
      if (b.streakCurrent !== a.streakCurrent)
        return b.streakCurrent - a.streakCurrent;
      if (b.xpTotal !== a.xpTotal) return b.xpTotal - a.xpTotal;
      return b.academicAura - a.academicAura;
    });

  const entries: LeaderboardEntry[] = ranked.slice(0, take).map((row, i) => ({
    rank: i + 1,
    displayName: row.displayName,
    streakCurrent: row.streakCurrent,
    xpTotal: row.xpTotal,
    academicAura: row.academicAura,
    avatarPresetId: row.showAvatar ? row.avatarPresetId : null,
    showAvatar: row.showAvatar,
    isYou: row.userId === viewerUserId,
  }));

  const viewerIndex = ranked.findIndex((r) => r.userId === viewerUserId);
  let viewer: LeaderboardEntry | null = null;
  if (viewerIndex >= 0) {
    const row = ranked[viewerIndex]!;
    viewer = {
      rank: viewerIndex + 1,
      displayName: row.displayName,
      streakCurrent: row.streakCurrent,
      xpTotal: row.xpTotal,
      academicAura: row.academicAura,
      avatarPresetId: row.showAvatar ? row.avatarPresetId : null,
      showAvatar: row.showAvatar,
      isYou: true,
    };
  }

  // Validate preset ids exist (strip unknown)
  for (const e of entries) {
    if (e.avatarPresetId && !getAvatarPreset(e.avatarPresetId)) {
      e.avatarPresetId = null;
    }
  }
  if (viewer?.avatarPresetId && !getAvatarPreset(viewer.avatarPresetId)) {
    viewer.avatarPresetId = null;
  }

  return {
    enabled: true as const,
    entries,
    viewer,
    totalOptedIn: ranked.length,
  };
}
