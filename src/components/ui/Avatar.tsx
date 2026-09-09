import type { CSSProperties, ReactNode } from "react";
import { getAvatarPreset, displayAvatarStatus } from "@/lib/avatar/presets";
import { userAvatarPhotoSrc } from "@/lib/avatar/selfie";
import type { AvatarPresence } from "@/lib/avatar/contextual-status";

type AvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "hero";
  className?: string;
  /** Uploaded selfie / photo URL (data URL). Curated character stills are ignored. */
  imageSrc?: string | null;
  /** Theme accent preset id (ring / swatch only) */
  presetId?: string | null;
  frame?: "none" | "streak" | "achievement" | "crown";
  aura?: number;
  status?: string;
  presence?: AvatarPresence | null;
  /**
   * `circle` for compact surfaces; `figure` for a full photo in profile/studio.
   * Without a photo, hero falls back to a large initials circle.
   */
  shape?: "circle" | "figure";
  /**
   * Unused for selection — initials are always automatic when no photo.
   * Kept so privacy callers can force initials (no photo exposure).
   */
  emptyFallback?: "neutral" | "initials";
  mode?: "identity" | "swatch";
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

const CIRCLE_SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-[0.7rem]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-base",
  "2xl": "h-[4.5rem] w-[4.5rem] text-lg sm:h-20 sm:w-20",
  hero: "h-[14rem] w-[14rem] text-4xl sm:h-[16rem] sm:w-[16rem] sm:text-5xl lg:h-[17.5rem] lg:w-[17.5rem] lg:text-6xl",
};

const FIGURE_SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "avatar-figure avatar-figure-sm",
  md: "avatar-figure avatar-figure-md",
  lg: "avatar-figure avatar-figure-lg",
  xl: "avatar-figure avatar-figure-xl",
  "2xl": "avatar-figure avatar-figure-2xl",
  hero: "avatar-figure avatar-figure-hero",
};

const FRAME_RING: Record<NonNullable<AvatarProps["frame"]>, string> = {
  none: "ring-1 ring-black/5 dark:ring-white/10",
  streak: "ring-2 ring-warning/70 ring-offset-2 ring-offset-surface",
  achievement: "ring-2 ring-primary/50 ring-offset-2 ring-offset-surface",
  crown: "ring-2 ring-primary/70 ring-offset-2 ring-offset-surface",
};

/**
 * StudentLife avatar — uploaded photo when present; silent initials otherwise.
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
  shape: shapeProp,
  mode = "identity",
}: AvatarProps) {
  const initials = initialsFromName(name || "Student");
  const preset = getAvatarPreset(presetId);
  const photoSrc = userAvatarPhotoSrc(imageSrc);
  const shape =
    shapeProp ?? (size === "hero" && photoSrc ? "figure" : "circle");
  const showChip = Boolean(status) && size !== "sm" && shape === "circle";
  const statusLabel = displayAvatarStatus(status);
  const showPresence = Boolean(presence) && presence !== "idle";

  if (mode === "swatch") {
    return (
      <span className={`relative inline-flex shrink-0 flex-col items-center ${className}`}>
        <span
          className={`avatar-face inline-flex items-center justify-center overflow-hidden rounded-full font-semibold ${CIRCLE_SIZE[size]} ${FRAME_RING.none} ${
            preset ? "" : "bg-primary-soft text-primary"
          }`}
          style={{
            ...(preset ? { background: preset.bg, color: preset.markColor } : {}),
          }}
          aria-hidden
        >
          {preset ? (
            <span className="select-none text-[1.05em] leading-none">{preset.mark}</span>
          ) : (
            initials
          )}
        </span>
      </span>
    );
  }

  const ringClass = FRAME_RING[frame];
  const themeStyle: CSSProperties | undefined =
    preset && frame === "none"
      ? { boxShadow: `0 0 0 2px color-mix(in oklab, ${preset.markColor} 35%, transparent)` }
      : undefined;

  if (shape === "figure" && photoSrc) {
    return (
      <span className={`relative inline-flex shrink-0 flex-col items-center ${className}`}>
        <span className="relative inline-flex items-end justify-center">
          <span className={FIGURE_SIZE[size]} aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoSrc}
              alt=""
              className="avatar-figure-img"
              draggable={false}
            />
          </span>
          {showPresence ? (
            <span
              className={`avatar-presence avatar-presence-figure avatar-presence-${presence}`}
              data-presence={presence}
            />
          ) : null}
        </span>
      </span>
    );
  }

  return (
    <span className={`relative inline-flex shrink-0 flex-col items-center ${className}`}>
      <span className="relative inline-flex">
        <span
          className={`avatar-face inline-flex items-center justify-center overflow-hidden rounded-full font-semibold ${CIRCLE_SIZE[size]} ${ringClass} ${
            photoSrc ? "bg-surface-secondary text-transparent" : "bg-primary-soft text-primary"
          }`}
          style={themeStyle}
          aria-hidden
        >
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc}
              alt=""
              className="h-full w-full object-cover object-top"
              draggable={false}
            />
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
