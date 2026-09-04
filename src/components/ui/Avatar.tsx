import type { ReactNode } from "react";
import { getAvatarPreset, displayAvatarStatus } from "@/lib/avatar/presets";
import type { AvatarPresence } from "@/lib/avatar/contextual-status";

type AvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "hero";
  className?: string;
  /** Legacy image URL (optional) */
  imageSrc?: string | null;
  /** Curated StudentLife preset id */
  presetId?: string | null;
  /** Optional frame ring for achievements / streaks */
  frame?: "none" | "streak" | "achievement" | "crown";
  /** Kept for callers; no longer used for a glow effect */
  aura?: number;
  /** Small status chip — hidden on sm to keep header chrome clean */
  status?: string;
  /** Live academic presence — visual only, never includes private details */
  presence?: AvatarPresence | null;
  children?: ReactNode;
};

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-[0.7rem]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-base",
  "2xl": "h-[4.5rem] w-[4.5rem] text-lg sm:h-20 sm:w-20",
  hero: "h-[4.75rem] w-[4.75rem] text-2xl lg:h-[10.5rem] lg:w-[10.5rem] lg:text-5xl",
};

const FRAME_RING: Record<NonNullable<AvatarProps["frame"]>, string> = {
  none: "ring-1 ring-black/5 dark:ring-white/10",
  streak: "ring-2 ring-warning/70 ring-offset-2 ring-offset-surface",
  achievement: "ring-2 ring-primary/50 ring-offset-2 ring-offset-surface",
  crown: "ring-2 ring-primary/70 ring-offset-2 ring-offset-surface",
};

/**
 * StudentLife avatar — initials fallback, optional curated preset, cosmetic frames.
 * Visual only: personality modes never change preset art.
 */
export function Avatar({
  name,
  size = "sm",
  className = "",
  imageSrc,
  presetId,
  frame = "none",
  status,
  presence = "idle",
}: AvatarProps) {
  const initials = initialsFromName(name || "Student");
  const preset = getAvatarPreset(presetId);
  const showChip = Boolean(status) && size !== "sm";
  const statusLabel = displayAvatarStatus(status);
  const showPresence = Boolean(presence) && presence !== "idle";

  return (
    <span className={`relative inline-flex shrink-0 flex-col items-center ${className}`}>
      <span className="relative inline-flex">
        <span
          className={`avatar-face inline-flex items-center justify-center overflow-hidden rounded-full font-semibold ${SIZE[size]} ${FRAME_RING[frame]} ${
            preset ? "" : "bg-primary-soft text-primary"
          }`}
          style={{
            ...(preset ? { background: preset.bg, color: preset.markColor } : {}),
          }}
          aria-hidden
        >
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt="" className="h-full w-full object-cover" />
          ) : preset ? (
            <span className="select-none text-[1.05em] leading-none">{preset.mark}</span>
          ) : (
            initials
          )}
        </span>
        {showPresence ? (
          <span
            className={`avatar-presence avatar-presence-${presence}`}
            data-presence={presence}
          />
        ) : null}
      </span>
      {showChip ? (
        <span className="absolute -bottom-1 max-w-[6.5rem] truncate rounded-md border border-border bg-surface px-1.5 py-0.5 text-[0.6rem] font-medium text-secondary">
          {statusLabel}
        </span>
      ) : null}
    </span>
  );
}
