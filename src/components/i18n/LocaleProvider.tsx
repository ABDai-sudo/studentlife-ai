"use client";

import {
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  languageNameToLocale,
} from "@/lib/i18n/config";
import {
  enableClientLocaleReads,
  getServerUiLocaleSnapshot,
  getUiLocaleSnapshot,
  hydrateUiLocaleFromProfile,
  subscribeUiLocale,
} from "@/lib/i18n/locale-store";
import { logTranslationAudit } from "@/lib/i18n/dev-audit";
import {
  applyDocumentLocale,
  useT,
  useUiLocale,
} from "@/lib/i18n/use-t";

let auditLogged = false;

/**
 * Sync server preferredUiLanguage into the locale store (no React setState).
 * Also keeps <html lang/dir> in sync with the active locale.
 */
export function LocaleHydrator({
  preferredUiLanguage,
}: {
  preferredUiLanguage?: string | null;
}) {
  const locale = useSyncExternalStore(
    subscribeUiLocale,
    getUiLocaleSnapshot,
    () =>
      preferredUiLanguage
        ? languageNameToLocale(preferredUiLanguage)
        : getServerUiLocaleSnapshot()
  );

  useLayoutEffect(() => {
    // Unlock client locale reads only after hydration, then sync profile/storage.
    enableClientLocaleReads();
    if (preferredUiLanguage) {
      hydrateUiLocaleFromProfile(preferredUiLanguage);
    }
    if (process.env.NODE_ENV === "development" && !auditLogged) {
      auditLogged = true;
      logTranslationAudit();
    }
  }, [preferredUiLanguage]);

  useLayoutEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  return null;
}

/** Optional wrapper when a subtree needs explicit hydrate (layouts use LocaleHydrator). */
export function LocaleProvider({
  children,
  preferredUiLanguage,
}: {
  children: ReactNode;
  preferredUiLanguage?: string | null;
}) {
  return (
    <>
      <LocaleHydrator preferredUiLanguage={preferredUiLanguage} />
      {children}
    </>
  );
}

export { useT, useUiLocale };
