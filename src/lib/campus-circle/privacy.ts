/**
 * Privacy-safe Campus Circle helpers.
 * Never include money, grades, email, location, or raw academic records.
 */

export const CAMPUS_STUDY_STATUSES = [
  "AVAILABLE",
  "FOCUSING",
  "IN_SESSION",
  "BREAK",
  "HIDDEN",
] as const;

export type CampusStudyStatusValue = (typeof CAMPUS_STUDY_STATUSES)[number];

export const CAMPUS_REACTION_KINDS = ["ENCOURAGE", "THANKS", "FOCUS"] as const;
export type CampusReactionKindValue = (typeof CAMPUS_REACTION_KINDS)[number];

export const CAMPUS_REPORT_REASONS = [
  "harassment",
  "spam",
  "inappropriate",
  "impersonation",
  "other",
] as const;

export const CAMPUS_REPORT_TARGETS = [
  "USER",
  "GROUP",
  "ACTIVITY",
  "INVITE",
  "CHALLENGE",
  "SHARE",
] as const;

export const PRIVATE_RECAP_KEYS = [
  "moneySaved",
  "averageScore",
  "email",
  "displayName",
  "xpTotal",
  "academicAura",
  "level",
] as const;

export type SanitizedRecapShare = {
  studyMinutes: number;
  tasksCompleted: number;
  quizzesCompleted: number;
  currentStreak: number;
};

function asNonNegInt(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

export function sanitizeRecapForShare(
  payload: Record<string, unknown> | null | undefined
): SanitizedRecapShare {
  const src = payload ?? {};
  return {
    studyMinutes: asNonNegInt(src.studyMinutes),
    tasksCompleted: asNonNegInt(src.tasksCompleted),
    quizzesCompleted: asNonNegInt(src.quizzesCompleted),
    currentStreak: asNonNegInt(src.currentStreak),
  };
}

export function recapShareHasPrivateFields(
  payload: Record<string, unknown>
): boolean {
  return PRIVATE_RECAP_KEYS.some((key) => key in payload);
}

export function visibleStudyStatus(input: {
  shareStudyStatus: boolean;
  studyStatus: CampusStudyStatusValue | string;
}): CampusStudyStatusValue | null {
  if (!input.shareStudyStatus) return null;
  if (input.studyStatus === "HIDDEN") return null;
  if (
    CAMPUS_STUDY_STATUSES.includes(input.studyStatus as CampusStudyStatusValue)
  ) {
    return input.studyStatus as CampusStudyStatusValue;
  }
  return null;
}

export type PublicStudentCard = {
  id: string;
  displayName: string;
  avatarPresetId: string | null;
  studyStatus: CampusStudyStatusValue | null;
};

export function publicDisplayName(
  displayName: string | null | undefined,
  fallback = "Student"
): string {
  const trimmed = displayName?.trim();
  return trimmed ? trimmed.slice(0, 80) : fallback;
}
