import { Prisma } from "@prisma/client";
import { prisma, withDbRetry } from "@/lib/db";
import type { OnboardingInput } from "@/lib/validations/auth";
import type { UpdateProfileInput } from "@/lib/validations/finance";
import type { PersonalityMode, ThemeMode } from "@prisma/client";
import {
  isValidAvatarPresetId,
  isValidAvatarStatus,
} from "@/lib/avatar/presets";
import type {
  AvatarPresence,
  AvatarStatusSource,
} from "@/lib/avatar/contextual-status";
import { resolveStudentStatusForUser, ensureAvatarStatusAutoColumn } from "@/services/student-status.service";

export type ProfileDto = {
  university: string | null;
  course: string | null;
  yearOfStudy: number | null;
  studentType: string;
  country: string;
  currency: string;
  monthlyPocketMoney: number | null;
  primaryGoal: string | null;
  onboardingComplete: boolean;
  timezone: string;
  institutionName: string | null;
  boardOrUniversity: string | null;
  classOrSemester: string | null;
  preferredExplanationLang: string | null;
  preferredUiLanguage: string | null;
  personalityMode: PersonalityMode;
  themeMode: ThemeMode;
  studyGoal: string | null;
  dailyStudyMinutes: number | null;
  weakSubjects: string | null;
  displayName: string | null;
  shareRecapsEnabled: boolean;
  leaderboardOptIn: boolean;
  avatarPresetId: string | null;
  avatarStatus: string | null;
  avatarStatusAuto: boolean;
  resolvedAvatarStatus: string | null;
  avatarPresence: AvatarPresence;
  avatarStatusSource: AvatarStatusSource;
  avatarStatusLive: boolean;
  leaderboardShowAvatar: boolean;
  xpTotal: number;
  level: number;
  academicAura: number;
  streakFreezeCount: number;
};

function toDto(row: {
  university: string | null;
  course: string | null;
  yearOfStudy: number | null;
  studentType: string;
  country: string;
  currency: string;
  monthlyPocketMoney: Prisma.Decimal | null;
  primaryGoal: string | null;
  onboardingComplete: boolean;
  timezone: string;
  institutionName: string | null;
  boardOrUniversity: string | null;
  classOrSemester: string | null;
  preferredExplanationLang: string | null;
  preferredUiLanguage: string | null;
  personalityMode: PersonalityMode;
  themeMode: ThemeMode;
  studyGoal: string | null;
  dailyStudyMinutes: number | null;
  weakSubjects: string | null;
  displayName: string | null;
  shareRecapsEnabled: boolean;
  leaderboardOptIn: boolean;
  avatarPresetId: string | null;
  avatarStatus: string | null;
  avatarStatusAuto?: boolean | null;
  leaderboardShowAvatar: boolean;
  xpTotal: number;
  level: number;
  academicAura: number;
  streakFreezeCount: number;
}): Omit<
  ProfileDto,
  | "resolvedAvatarStatus"
  | "avatarPresence"
  | "avatarStatusSource"
  | "avatarStatusLive"
> {
  return {
    university: row.university,
    course: row.course,
    yearOfStudy: row.yearOfStudy,
    studentType: row.studentType,
    country: row.country,
    currency: row.currency,
    monthlyPocketMoney:
      row.monthlyPocketMoney != null ? Number(row.monthlyPocketMoney) : null,
    primaryGoal: row.primaryGoal,
    onboardingComplete: row.onboardingComplete,
    timezone: row.timezone,
    institutionName: row.institutionName,
    boardOrUniversity: row.boardOrUniversity,
    classOrSemester: row.classOrSemester,
    preferredExplanationLang: row.preferredExplanationLang,
    preferredUiLanguage: row.preferredUiLanguage,
    personalityMode: row.personalityMode,
    themeMode: row.themeMode,
    studyGoal: row.studyGoal,
    dailyStudyMinutes: row.dailyStudyMinutes,
    weakSubjects: row.weakSubjects,
    displayName: row.displayName,
    shareRecapsEnabled: row.shareRecapsEnabled,
    leaderboardOptIn: row.leaderboardOptIn,
    avatarPresetId: row.avatarPresetId,
    avatarStatus: row.avatarStatus,
    avatarStatusAuto: row.avatarStatusAuto !== false,
    leaderboardShowAvatar: row.leaderboardShowAvatar,
    xpTotal: row.xpTotal,
    level: row.level,
    academicAura: row.academicAura,
    streakFreezeCount: row.streakFreezeCount,
  };
}

async function withResolvedStatus(
  userId: string,
  dto: ReturnType<typeof toDto>
): Promise<ProfileDto> {
  const resolved = await resolveStudentStatusForUser(userId, dto);
  return {
    ...dto,
    resolvedAvatarStatus: resolved.status,
    avatarPresence: resolved.presence,
    avatarStatusSource: resolved.source,
    avatarStatusLive: resolved.live,
  };
}

export async function getProfileForUser(userId: string): Promise<ProfileDto | null> {
  await ensureAvatarStatusAutoColumn();
  const profile = await withDbRetry(() =>
    prisma.studentProfile.findUnique({ where: { userId } })
  );
  return profile ? withResolvedStatus(userId, toDto(profile)) : null;
}

export async function completeOnboardingForUser(
  userId: string,
  input: OnboardingInput
): Promise<ProfileDto> {
  const profile = await prisma.studentProfile.upsert({
    where: { userId },
    create: {
      userId,
      monthlyPocketMoney: new Prisma.Decimal(input.monthlyPocketMoney.toFixed(2)),
      studentType: input.studentType,
      primaryGoal: input.primaryGoal,
      country: input.country,
      currency: input.currency,
      university: input.university || null,
      course: input.course || null,
      yearOfStudy: input.yearOfStudy ?? null,
      institutionName: input.institutionName || input.university || null,
      classOrSemester: input.classOrSemester || null,
      studyGoal: input.studyGoal || input.primaryGoal || null,
      preferredExplanationLang: input.preferredExplanationLang || "English",
      personalityMode: input.personalityMode ?? "PROFESSIONAL",
      onboardingComplete: true,
    },
    update: {
      monthlyPocketMoney: new Prisma.Decimal(input.monthlyPocketMoney.toFixed(2)),
      studentType: input.studentType,
      primaryGoal: input.primaryGoal,
      country: input.country,
      currency: input.currency,
      university: input.university || null,
      course: input.course || null,
      yearOfStudy: input.yearOfStudy ?? null,
      institutionName: input.institutionName || input.university || null,
      classOrSemester: input.classOrSemester || null,
      studyGoal: input.studyGoal || input.primaryGoal || null,
      preferredExplanationLang: input.preferredExplanationLang || "English",
      personalityMode: input.personalityMode ?? "PROFESSIONAL",
      onboardingComplete: true,
    },
  });

  return withResolvedStatus(userId, toDto(profile));
}

export async function updateProfileForUser(
  userId: string,
  input: UpdateProfileInput
): Promise<ProfileDto> {
  await ensureAvatarStatusAutoColumn();
  const data: Prisma.StudentProfileUpdateInput = {};

  if (input.monthlyPocketMoney != null) {
    data.monthlyPocketMoney = new Prisma.Decimal(
      input.monthlyPocketMoney.toFixed(2)
    );
  }
  if (input.studentType) data.studentType = input.studentType;
  if (input.primaryGoal) data.primaryGoal = input.primaryGoal;
  if (input.country) data.country = input.country;
  if (input.currency) data.currency = input.currency;
  if (input.timezone) data.timezone = input.timezone;
  if (input.university !== undefined) data.university = input.university || null;
  if (input.course !== undefined) data.course = input.course || null;
  if (input.yearOfStudy !== undefined) data.yearOfStudy = input.yearOfStudy;
  if (input.institutionName !== undefined)
    data.institutionName = input.institutionName || null;
  if (input.boardOrUniversity !== undefined)
    data.boardOrUniversity = input.boardOrUniversity || null;
  if (input.classOrSemester !== undefined)
    data.classOrSemester = input.classOrSemester || null;
  if (input.preferredExplanationLang !== undefined)
    data.preferredExplanationLang = input.preferredExplanationLang || null;
  if (input.preferredUiLanguage !== undefined)
    data.preferredUiLanguage = input.preferredUiLanguage || null;
  if (input.personalityMode) data.personalityMode = input.personalityMode;
  if (input.themeMode) data.themeMode = input.themeMode;
  if (input.studyGoal !== undefined) data.studyGoal = input.studyGoal || null;
  if (input.dailyStudyMinutes !== undefined)
    data.dailyStudyMinutes = input.dailyStudyMinutes;
  if (input.weakSubjects !== undefined)
    data.weakSubjects = input.weakSubjects || null;
  if (input.displayName !== undefined)
    data.displayName = input.displayName || null;
  if (input.shareRecapsEnabled !== undefined)
    data.shareRecapsEnabled = input.shareRecapsEnabled;
  if (input.leaderboardOptIn !== undefined)
    data.leaderboardOptIn = input.leaderboardOptIn;
  if (input.avatarPresetId !== undefined) {
    const id = input.avatarPresetId || null;
    if (id && !isValidAvatarPresetId(id)) {
      throw new Error("INVALID_AVATAR_PRESET");
    }
    data.avatarPresetId = id;
  }
  if (input.avatarStatus !== undefined) {
    const status = input.avatarStatus || null;
    if (status && !isValidAvatarStatus(status)) {
      throw new Error("INVALID_AVATAR_STATUS");
    }
    data.avatarStatus = status;
  }
  if (input.avatarStatusAuto !== undefined) {
    data.avatarStatusAuto = input.avatarStatusAuto;
  }
  if (input.leaderboardShowAvatar !== undefined) {
    data.leaderboardShowAvatar = input.leaderboardShowAvatar;
  }

  const profile = await prisma.studentProfile.upsert({
    where: { userId },
    create: {
      userId,
      monthlyPocketMoney:
        input.monthlyPocketMoney != null
          ? new Prisma.Decimal(input.monthlyPocketMoney.toFixed(2))
          : null,
      studentType: input.studentType ?? "DAY_SCHOLAR",
      primaryGoal: input.primaryGoal ?? null,
      country: input.country ?? "IN",
      currency: input.currency ?? "INR",
      university: input.university || null,
      course: input.course || null,
      yearOfStudy: input.yearOfStudy ?? null,
      timezone: input.timezone ?? "Asia/Kolkata",
      institutionName: input.institutionName || null,
      boardOrUniversity: input.boardOrUniversity || null,
      classOrSemester: input.classOrSemester || null,
      preferredExplanationLang: input.preferredExplanationLang || null,
      preferredUiLanguage: input.preferredUiLanguage || null,
      personalityMode: input.personalityMode ?? "PROFESSIONAL",
      themeMode: input.themeMode ?? "SYSTEM",
      studyGoal: input.studyGoal || null,
      dailyStudyMinutes: input.dailyStudyMinutes ?? null,
      weakSubjects: input.weakSubjects || null,
      displayName: input.displayName || null,
      shareRecapsEnabled: input.shareRecapsEnabled ?? true,
      leaderboardOptIn: input.leaderboardOptIn ?? false,
      avatarPresetId: input.avatarPresetId || null,
      avatarStatus: input.avatarStatus || null,
      avatarStatusAuto: input.avatarStatusAuto ?? true,
      leaderboardShowAvatar: input.leaderboardShowAvatar ?? true,
      onboardingComplete: input.monthlyPocketMoney != null,
    },
    update: data,
  });

  return withResolvedStatus(userId, toDto(profile));
}
