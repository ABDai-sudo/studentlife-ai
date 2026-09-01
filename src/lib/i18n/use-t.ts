"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { MessageParams, UiLocale } from "@/lib/i18n/types";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";
import {
  languageNameToLocale,
  localeDirection,
  LOCALE_BCP47,
} from "@/lib/i18n/config";
import {
  getServerUiLocaleSnapshot,
  getUiLocaleSnapshot,
  subscribeUiLocale,
  writeUiLocale,
  writeUiLocaleFromLanguageName,
} from "@/lib/i18n/locale-store";
import { t as translate } from "@/lib/i18n/translator";

/** Apply active locale to <html lang> and dir. */
export function applyDocumentLocale(locale: UiLocale) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.lang = LOCALE_BCP47[locale];
  root.dir = localeDirection(locale);
}

export function useUiLocale(): UiLocale {
  return useSyncExternalStore(
    subscribeUiLocale,
    getUiLocaleSnapshot,
    () => getServerUiLocaleSnapshot()
  );
}

export function useT() {
  const locale = useUiLocale();

  const t = useCallback(
    (key: MessageKey, params?: MessageParams) => translate(key, locale, params),
    [locale]
  );

  const setLocale = useCallback((next: UiLocale) => {
    writeUiLocale(next, { explicit: true });
    applyDocumentLocale(next);
  }, []);

  const setLocaleFromLanguageName = useCallback((name: string) => {
    writeUiLocaleFromLanguageName(name, { explicit: true });
    applyDocumentLocale(languageNameToLocale(name));
  }, []);

  return { t, locale, setLocale, setLocaleFromLanguageName };
}
