import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { getProfileForUser } from "@/services/profile.service";
import { prisma } from "@/lib/db";
import { deriveAvatarFrame } from "@/lib/avatar/presets";

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  const streak = await prisma.streak.findUnique({
    where: { userId_type: { userId: user.id, type: "study" } },
    select: { currentCount: true },
  });
  const achievements = await prisma.achievement.findMany({
    where: { userId: user.id },
    select: { code: true },
    take: 20,
  });
  const cosmeticFrame = deriveAvatarFrame({
    streakCurrent: streak?.currentCount ?? 0,
    xpTotal: profile?.xpTotal ?? 0,
    academicAura: profile?.academicAura ?? 50,
    achievementCodes: achievements.map((a) => a.code),
  });

  return (
    <AppShell
      title="Profile"
      subtitle="Your student identity"
      titleKey="profile.title"
      subtitleKey="profile.subtitleRedesign"
      userName={user.name ?? "Student"}
      displayName={profile?.displayName}
      avatarPresetId={profile?.avatarPresetId}
      avatarImageUrl={profile?.avatarImageUrl}
      avatarStatus={profile?.resolvedAvatarStatus ?? profile?.avatarStatus}
      avatarPresence={profile?.avatarPresence}
    >
      <ProfileClient
        email={user.email}
        name={user.name}
        plan={user.plan}
        streakCurrent={streak?.currentCount ?? 0}
        cosmeticFrame={cosmeticFrame}
        achievementCodes={achievements.map((a) => a.code)}
        initialProfile={
          profile
            ? {
                monthlyPocketMoney: profile.monthlyPocketMoney,
                studentType: profile.studentType,
                primaryGoal: profile.primaryGoal,
                currency: profile.currency,
                university: profile.university,
                course: profile.course,
                institutionName: profile.institutionName,
                boardOrUniversity: profile.boardOrUniversity,
                classOrSemester: profile.classOrSemester,
                preferredExplanationLang: profile.preferredExplanationLang,
                studyGoal: profile.studyGoal,
                dailyStudyMinutes: profile.dailyStudyMinutes,
                weakSubjects: profile.weakSubjects,
                onboardingComplete: profile.onboardingComplete,
                displayName: profile.displayName,
                avatarPresetId: profile.avatarPresetId,
                avatarImageUrl: profile.avatarImageUrl,
                avatarStatus: profile.avatarStatus,
                avatarStatusAuto: profile.avatarStatusAuto,
                resolvedAvatarStatus: profile.resolvedAvatarStatus,
                avatarPresence: profile.avatarPresence,
                avatarStatusSource: profile.avatarStatusSource,
                avatarStatusLive: profile.avatarStatusLive,
                leaderboardOptIn: profile.leaderboardOptIn,
                xpTotal: profile.xpTotal,
                level: profile.level,
                academicAura: profile.academicAura,
              }
            : null
        }
      />
    </AppShell>
  );
}
