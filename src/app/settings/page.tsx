import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { PersonalityProvider } from "@/components/app/PersonalityProvider";
import { getProfileForUser } from "@/services/profile.service";
import { getNotificationPreferences } from "@/services/notification.service";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);

  let initialNotifPrefs = null;
  try {
    const prefs = await getNotificationPreferences(user.id);
    initialNotifPrefs = {
      pauseAll: prefs.pauseAll,
      streakAtRisk: prefs.streakAtRisk,
      streakFinalReminder: prefs.streakFinalReminder,
      dailyQuests: prefs.dailyQuests,
      assignmentDeadline: prefs.assignmentDeadline,
      upcomingExam: prefs.upcomingExam,
      overspending: prefs.overspending,
      savingsGoal: prefs.savingsGoal,
      weeklyRecap: prefs.weeklyRecap,
      lowMoney: prefs.lowMoney,
    };
  } catch {
    initialNotifPrefs = null;
  }

  return (
    <PersonalityProvider
      personality={profile?.personalityMode ?? "PROFESSIONAL"}
      theme={profile?.themeMode ?? "SYSTEM"}
      preferredUiLanguage={profile?.preferredUiLanguage}
    >
      <AppShell
        title="Settings"
        subtitle="Account, preferences, and privacy"
        titleKey="settings.title"
        subtitleKey="settings.subtitle"
        userName={user.name ?? "Student"}
        displayName={profile?.displayName}
        avatarPresetId={profile?.avatarPresetId}
        avatarStatus={profile?.avatarStatus}
      >
        <SettingsClient
          email={user.email}
          name={user.name}
          plan={user.plan}
          initialNotifPrefs={initialNotifPrefs}
          initialProfile={
            profile
              ? {
                  currency: profile.currency,
                  country: profile.country,
                  timezone: profile.timezone,
                  studentType: profile.studentType,
                  monthlyPocketMoney: profile.monthlyPocketMoney,
                  preferredExplanationLang: profile.preferredExplanationLang,
                  preferredUiLanguage: profile.preferredUiLanguage,
                  displayName: profile.displayName,
                  leaderboardOptIn: profile.leaderboardOptIn,
                  leaderboardShowAvatar: profile.leaderboardShowAvatar,
                  avatarPresetId: profile.avatarPresetId,
                  avatarStatus: profile.avatarStatus,
                }
              : null
          }
        />
      </AppShell>
    </PersonalityProvider>
  );
}
