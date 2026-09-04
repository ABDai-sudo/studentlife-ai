"use client";

import { useEffect } from "react";
import { rememberLoginContext } from "@/lib/avatar/login-preview";
import type { PersonalityMode } from "@/lib/personality";
import type { AvatarPresence } from "@/lib/avatar/contextual-status";

type IdentityHint = {
  avatarPresetId?: string | null;
  displayName?: string | null;
  avatarPresence?: AvatarPresence | null;
};

/**
 * Remembers public identity hints for the next login preview.
 * Does not change avatar resolution or status behavior.
 */
export function RememberLoginContext({
  identity,
  personality,
}: {
  identity?: IdentityHint | null;
  personality?: PersonalityMode;
}) {
  useEffect(() => {
    if (!identity && personality === undefined) return;
    rememberLoginContext({
      ...(identity
        ? {
            savedPresetId: identity.avatarPresetId ?? null,
            savedDisplayName: identity.displayName ?? null,
            examWeekHint:
              identity.avatarPresence === "exam" ||
              identity.avatarPresence === "deadline",
          }
        : {}),
      ...(personality !== undefined
        ? { broModeHint: personality === "CAMPUS_BRO" }
        : {}),
    });
  }, [identity, personality]);

  return null;
}
