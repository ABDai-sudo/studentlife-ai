"use client";

import type { ReactNode } from "react";
import type { PersonalityMode, ThemeMode } from "@/lib/personality";
import { PreferencesHydrator } from "@/components/theme/ThemeProvider";
import { LocaleHydrator } from "@/components/i18n/LocaleProvider";
import { setServerPreferredUiLanguage } from "@/lib/i18n/locale-store";

type PersonalityProviderProps = {
  children: ReactNode;
  personality?: PersonalityMode;
  theme?: ThemeMode;
  preferredUiLanguage?: string | null;
};

/**
 * Syncs profile personality + theme + UI language into root stores.
 * ThemeProvider itself must live in the root layout (no nested providers).
 */
export function PersonalityProvider({
  children,
  personality = "PROFESSIONAL",
  theme = "SYSTEM",
  preferredUiLanguage,
}: PersonalityProviderProps) {
  // Align useSyncExternalStore server snapshot with profile language (avoids hydration flash).
  setServerPreferredUiLanguage(preferredUiLanguage);

  return (
    <>
      <PreferencesHydrator personality={personality} theme={theme} />
      <LocaleHydrator preferredUiLanguage={preferredUiLanguage} />
      {children}
    </>
  );
}
