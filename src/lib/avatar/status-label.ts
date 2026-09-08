import type { MessageKey } from "@/lib/i18n/dictionaries/en";
import { displayAvatarStatus } from "@/lib/avatar/presets";

const STATUS_KEYS: Record<string, MessageKey> = {
  Focused: "avatar.status.focused",
  "Exam mode": "avatar.status.exam",
  "Under pressure": "avatar.status.pressure",
  "Catching up": "avatar.status.catchingUp",
  "On track": "avatar.status.onTrack",
  "Deadline week": "avatar.status.deadline",
  "Budget watch": "avatar.status.budget",
  "In session": "avatar.status.session",
  Grinding: "avatar.status.grinding",
  "Taking a break": "avatar.status.break",
  "In class": "avatar.status.class",
  Available: "avatar.status.available",
  Offline: "avatar.status.offline",
};

export function avatarStatusMessageKey(
  status: string | null | undefined
): MessageKey | null {
  if (!status) return null;
  return STATUS_KEYS[displayAvatarStatus(status)] ?? null;
}

export function avatarStatusSourceKey(
  source: string | null | undefined
): MessageKey | null {
  switch (source) {
    case "session":
      return "avatar.source.session";
    case "class":
      return "avatar.source.class";
    case "exam":
      return "avatar.source.exam";
    case "deadline":
      return "avatar.source.deadline";
    case "manual":
      return "avatar.source.manual";
    default:
      return null;
  }
}
