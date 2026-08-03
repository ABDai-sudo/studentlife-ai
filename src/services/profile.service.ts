import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { OnboardingInput } from "@/lib/validations/auth";
import type { UpdateProfileInput } from "@/lib/validations/finance";

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
}): ProfileDto {
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
  };
}

export async function getProfileForUser(userId: string): Promise<ProfileDto | null> {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  return profile ? toDto(profile) : null;
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
      onboardingComplete: true,
    },
  });

  return toDto(profile);
}

export async function updateProfileForUser(
  userId: string,
  input: UpdateProfileInput
): Promise<ProfileDto> {
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
  if (input.university !== undefined) {
    data.university = input.university || null;
  }
  if (input.course !== undefined) data.course = input.course || null;
  if (input.yearOfStudy !== undefined) data.yearOfStudy = input.yearOfStudy;

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
      onboardingComplete: input.monthlyPocketMoney != null,
    },
    update: data,
  });

  return toDto(profile);
}
