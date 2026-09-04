/**
 * Feature flags — keep unfinished social surfaces off by default.
 * Set env to "true" to enable; anything else (including unset) follows the default.
 */
function flag(name: string, defaultEnabled: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultEnabled;
  return raw === "true";
}

export const features = {
  classHub: flag("FEATURE_CLASS_HUB", true),
  campusCircle: flag("FEATURE_CAMPUS_CIRCLE", false),
  /** Global streak leaderboard — real opted-in users only */
  leaderboard: flag("FEATURE_LEADERBOARD", true),
  studyBuddy: flag("FEATURE_STUDY_BUDDY", true),
  webPush: flag("FEATURE_WEB_PUSH", false),
  moneyGuardianAlerts: flag("FEATURE_MONEY_GUARDIAN", true),
  studyNotifications: flag("FEATURE_STUDY_NOTIFICATIONS", true),
} as const;
