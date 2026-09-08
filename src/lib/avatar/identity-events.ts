import type {
  AvatarPresence,
  AvatarStatusSource,
} from "@/lib/avatar/contextual-status";

export const IDENTITY_CHANGE_EVENT = "sl-identity-change";

export type IdentityChangeDetail = {
  avatarPresetId?: string | null;
  avatarImageUrl?: string | null;
  avatarStatus?: string | null;
  resolvedAvatarStatus?: string | null;
  avatarPresence?: AvatarPresence | null;
  avatarStatusSource?: AvatarStatusSource | null;
  avatarStatusLive?: boolean;
  avatarStatusAuto?: boolean;
  displayName?: string | null;
};

/** Notify chrome (header) after a successful profile identity save. */
export function broadcastIdentityChange(detail: IdentityChangeDetail) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent<IdentityChangeDetail>(IDENTITY_CHANGE_EVENT, { detail })
    );
  } catch {
    /* ignore */
  }
}
