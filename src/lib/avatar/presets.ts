/**
 * Curated StudentLife AI avatar presets.
 * Original abstract identities — not Bitmoji/Snapchat copies.
 * Persist only the stable `id` on StudentProfile.avatarPresetId.
 */

export type AvatarPreset = {
  id: string;
  label: string;
  /** Soft CSS gradient / solid for the avatar face circle */
  bg: string;
  /** Accent glyph or initials-style mark (Unicode, not proprietary art) */
  mark: string;
  /** Text color for mark */
  markColor: string;
};

export const AVATAR_PRESETS: readonly AvatarPreset[] = [
  { id: "aurora", label: "Aurora", bg: "linear-gradient(145deg,#7c9cff,#c4b5fd)", mark: "◇", markColor: "#fff" },
  { id: "ember", label: "Ember", bg: "linear-gradient(145deg,#fb923c,#f43f5e)", mark: "◆", markColor: "#fff" },
  { id: "mint", label: "Mint", bg: "linear-gradient(145deg,#34d399,#2dd4bf)", mark: "◇", markColor: "#064e3b" },
  { id: "ink", label: "Ink", bg: "linear-gradient(145deg,#1e293b,#475569)", mark: "●", markColor: "#e2e8f0" },
  { id: "sunlit", label: "Sunlit", bg: "linear-gradient(145deg,#fbbf24,#f97316)", mark: "○", markColor: "#422006" },
  { id: "ocean", label: "Ocean", bg: "linear-gradient(145deg,#38bdf8,#6366f1)", mark: "○", markColor: "#fff" },
  { id: "violet", label: "Violet", bg: "linear-gradient(145deg,#a78bfa,#ec4899)", mark: "◈", markColor: "#fff" },
  { id: "forest", label: "Forest", bg: "linear-gradient(145deg,#166534,#65a30d)", mark: "▲", markColor: "#ecfccb" },
  { id: "slate", label: "Slate", bg: "linear-gradient(145deg,#64748b,#94a3b8)", mark: "■", markColor: "#f8fafc" },
  { id: "coral", label: "Coral", bg: "linear-gradient(145deg,#fb7185,#fda4af)", mark: "●", markColor: "#4c0519" },
  { id: "cobalt", label: "Cobalt", bg: "linear-gradient(145deg,#1d4ed8,#3b82f6)", mark: "◆", markColor: "#eff6ff" },
  { id: "sand", label: "Sand", bg: "linear-gradient(145deg,#d6d3d1,#a8a29e)", mark: "◇", markColor: "#1c1917" },
  { id: "lilac", label: "Lilac", bg: "linear-gradient(145deg,#ddd6fe,#c4b5fd)", mark: "○", markColor: "#4c1d95" },
  { id: "jade", label: "Jade", bg: "linear-gradient(145deg,#10b981,#059669)", mark: "●", markColor: "#ecfdf5" },
  { id: "midnight", label: "Midnight", bg: "linear-gradient(145deg,#0f172a,#312e81)", mark: "●", markColor: "#c7d2fe" },
  { id: "peach", label: "Peach", bg: "linear-gradient(145deg,#fdba74,#fb923c)", mark: "◈", markColor: "#7c2d12" },
] as const;

/** Compact status picker for profile / Avatar Studio. */
export const AVATAR_STATUSES = [
  "Focused",
  "In class",
  "Exam mode",
  "Grinding",
  "Taking a break",
  "Available",
  "Offline",
] as const;

/** Older stored values — still valid, mapped to current labels where possible. */
const LEGACY_STATUS_ALIASES: Record<string, string> = {
  "Locking In": "Focused",
  "Exam Mode": "Exam mode",
  "Barely Surviving": "Focused",
  "On a Comeback": "Grinding",
  "Academic Villain": "Focused",
  "Focus Mode": "Focused",
  "Deadline Survivor": "Exam mode",
  "Financial Damage": "Focused",
  "In session": "Grinding",
  "Under pressure": "Exam mode",
  "Catching up": "Grinding",
  "On track": "Available",
  "Deadline week": "Exam mode",
  "Budget watch": "Focused",
  "Touching Grass": "Taking a break",
};

export type AvatarStatus = (typeof AVATAR_STATUSES)[number];

export function displayAvatarStatus(
  status: string | null | undefined
): string {
  if (!status) return "";
  return LEGACY_STATUS_ALIASES[status] ?? status;
}

export function getAvatarPreset(id: string | null | undefined): AvatarPreset | null {
  if (!id) return null;
  return AVATAR_PRESETS.find((p) => p.id === id) ?? null;
}

export function isValidAvatarPresetId(id: string | null | undefined): boolean {
  return Boolean(id && AVATAR_PRESETS.some((p) => p.id === id));
}

export function isValidAvatarStatus(status: string | null | undefined): boolean {
  if (!status) return true;
  if ((AVATAR_STATUSES as readonly string[]).includes(status)) return true;
  return Object.prototype.hasOwnProperty.call(LEGACY_STATUS_ALIASES, status);
}

/** Curated identity looks for Avatar Studio (not Bitmoji clones). */
export const AVATAR_IDENTITY_LOOKS = [
  {
    id: "male",
    labelKey: "avatar.identity.male" as const,
    imageSrc: "/login/student-male.png",
  },
  {
    id: "female",
    labelKey: "avatar.identity.female" as const,
    imageSrc: "/login/student-female.png",
  },
  {
    id: "neutral",
    labelKey: "avatar.identity.neutral" as const,
    imageSrc: "/login/student-neutral.png",
  },
] as const;

/** Server-derived cosmetic frame from real progress (never client-spoofable). */
export type AvatarFrameId = "none" | "streak7" | "streak30" | "streak100" | "xp" | "aura" | "achievement";

export function deriveAvatarFrame(input: {
  streakCurrent: number;
  xpTotal: number;
  academicAura: number;
  achievementCodes: string[];
}): AvatarFrameId {
  if (input.streakCurrent >= 100) return "streak100";
  if (input.streakCurrent >= 30) return "streak30";
  if (input.streakCurrent >= 7) return "streak7";
  if (input.achievementCodes.includes("FIRST_QUEST") || input.achievementCodes.includes("FIRST_SESSION"))
    return "achievement";
  if (input.xpTotal >= 1000) return "xp";
  if (input.academicAura >= 80) return "aura";
  return "none";
}

/** Map derived frame to Avatar UI ring prop. */
export function frameToUiRing(
  frame: AvatarFrameId
): "none" | "streak" | "achievement" | "crown" {
  if (frame === "streak7" || frame === "streak30" || frame === "streak100")
    return "streak";
  if (frame === "achievement" || frame === "aura") return "achievement";
  if (frame === "xp") return "crown";
  return "none";
}
