/**
 * Privacy-safe contextual student status.
 * Derived from live study/class activity and coarse academic windows.
 * Never includes subject names, assignment titles, exam names, grades, money, or location.
 */

import { displayAvatarStatus } from "@/lib/avatar/presets";

export const AVATAR_PRESENCES = [
  "idle",
  "session",
  "class",
  "exam",
  "deadline",
  "focus",
  "break",
] as const;

export type AvatarPresence = (typeof AVATAR_PRESENCES)[number];

export const AVATAR_STATUS_SOURCES = [
  "none",
  "manual",
  "session",
  "class",
  "exam",
  "deadline",
] as const;

export type AvatarStatusSource = (typeof AVATAR_STATUS_SOURCES)[number];

export const DERIVED_STATUS = {
  session: "In session",
  class: "In class",
  exam: "Exam mode",
  deadline: "Deadline week",
} as const;

export const LIVE_SESSION_MAX_MS = 3 * 60 * 60 * 1000;
export const EXAM_WINDOW_DAYS = 7;
export const DEADLINE_WINDOW_DAYS = 3;

export type ResolvedStudentStatus = {
  status: string | null;
  source: AvatarStatusSource;
  presence: AvatarPresence;
  live: boolean;
};

export type ContextualSignals = {
  autoEnabled: boolean;
  manualStatus: string | null;
  hasLiveSession: boolean;
  hasCurrentClass: boolean;
  examWithinDays: number | null;
  assignmentDueWithinDays: number | null;
};

export type ZonedClock = {
  dayKey: string;
  weekday: number;
  minutes: number;
};

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const PRIVATE_STATUS_NEEDLES = [
  "@",
  "grade",
  "gpa",
  "cgpa",
  "rupee",
  "₹",
  "salary",
  "password",
  "email",
  "phone",
  "address",
  "location",
];

export function zonedClock(timeZone: string, date = new Date()): ZonedClock {
  const tz = timeZone || "Asia/Kolkata";
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
  } catch {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
  }
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month").padStart(2, "0");
  const day = get("day").padStart(2, "0");
  const hour = Number(get("hour")) || 0;
  const minute = Number(get("minute")) || 0;
  return {
    dayKey: `${year}-${month}-${day}`,
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
    minutes: hour * 60 + minute,
  };
}

export function dayKeyFromDate(timeZone: string, date: Date): string {
  return zonedClock(timeZone, date).dayKey;
}

export function civilDaysBetween(fromDayKey: string, toDayKey: string): number {
  const parse = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return Date.UTC(y || 0, (m || 1) - 1, d || 1);
  };
  return Math.round((parse(toDayKey) - parse(fromDayKey)) / 86_400_000);
}

export function parseHmToMinutes(hm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function isCurrentClassSlot(input: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  nowWeekday: number;
  nowMinutes: number;
}): boolean {
  if (input.dayOfWeek !== input.nowWeekday) return false;
  const start = parseHmToMinutes(input.startTime);
  const end = parseHmToMinutes(input.endTime);
  if (start == null || end == null) return false;
  if (end > start) {
    return input.nowMinutes >= start && input.nowMinutes < end;
  }
  return input.nowMinutes >= start || input.nowMinutes < end;
}

export function isLiveStudySession(input: {
  completed: boolean;
  endedAt: Date | string | null;
  startedAt: Date | string;
  now: Date;
}): boolean {
  if (input.completed || input.endedAt) return false;
  const started =
    input.startedAt instanceof Date
      ? input.startedAt.getTime()
      : new Date(input.startedAt).getTime();
  if (!Number.isFinite(started)) return false;
  const elapsed = input.now.getTime() - started;
  return elapsed >= 0 && elapsed <= LIVE_SESSION_MAX_MS;
}

export function presenceFromManual(status: string | null | undefined): AvatarPresence {
  const label = displayAvatarStatus(status);
  switch (label) {
    case "In session":
      return "session";
    case "Exam mode":
      return "exam";
    case "Deadline week":
      return "deadline";
    case "Taking a break":
      return "break";
    case "Focused":
    case "On track":
    case "Catching up":
    case "Under pressure":
      return "focus";
    default:
      return "idle";
  }
}

export function resolveStudentStatus(
  signals: ContextualSignals
): ResolvedStudentStatus {
  const manual = displayAvatarStatus(signals.manualStatus) || null;

  if (signals.autoEnabled) {
    if (signals.hasLiveSession) {
      return {
        status: DERIVED_STATUS.session,
        source: "session",
        presence: "session",
        live: true,
      };
    }
    if (signals.hasCurrentClass) {
      return {
        status: DERIVED_STATUS.class,
        source: "class",
        presence: "class",
        live: true,
      };
    }
  }

  if (manual) {
    return {
      status: manual,
      source: "manual",
      presence: presenceFromManual(manual),
      live: false,
    };
  }

  if (signals.autoEnabled) {
    const examDays = signals.examWithinDays;
    if (
      examDays != null &&
      examDays >= 0 &&
      examDays <= EXAM_WINDOW_DAYS
    ) {
      return {
        status: DERIVED_STATUS.exam,
        source: "exam",
        presence: "exam",
        live: false,
      };
    }
    const dueDays = signals.assignmentDueWithinDays;
    if (
      dueDays != null &&
      dueDays <= DEADLINE_WINDOW_DAYS &&
      dueDays >= -1
    ) {
      return {
        status: DERIVED_STATUS.deadline,
        source: "deadline",
        presence: "deadline",
        live: false,
      };
    }
  }

  return { status: null, source: "none", presence: "idle", live: false };
}

export function publicIdentityStatus(resolved: ResolvedStudentStatus): {
  status: string | null;
  presence: AvatarPresence;
  source: AvatarStatusSource;
  live: boolean;
} {
  return {
    status: resolved.status,
    presence: resolved.presence,
    source: resolved.source,
    live: resolved.live,
  };
}

export function statusLooksPrivate(value: string | null | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return PRIVATE_STATUS_NEEDLES.some((needle) => lower.includes(needle));
}

export function presenceFromCampusStudyStatus(
  status: string | null | undefined
): AvatarPresence {
  switch (status) {
    case "IN_SESSION":
      return "session";
    case "FOCUSING":
      return "focus";
    case "BREAK":
      return "break";
    default:
      return "idle";
  }
}
