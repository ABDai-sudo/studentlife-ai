import type { UiLocale } from "./types";
import { UI_LOCALE_CODES } from "./types";
import {
  getLanguageByCode,
  getLanguageByEnglishName,
} from "./languages-registry";

/** Display names for ready UI locales (DB / Settings). Keep in sync with ready registry entries. */
export const UI_LANGUAGE_NAMES = ["English", "Hindi", "Gujarati"] as const;
export type UiLanguageName = (typeof UI_LANGUAGE_NAMES)[number];

export const LANGUAGE_TO_LOCALE: Record<UiLanguageName, UiLocale> = {
  English: "en",
  Hindi: "hi",
  Gujarati: "gu",
};

export const LOCALE_TO_LANGUAGE: Record<UiLocale, UiLanguageName> = {
  en: "English",
  hi: "Hindi",
  gu: "Gujarati",
};

export const LOCALE_BCP47: Record<UiLocale, string> = {
  en: "en",
  hi: "hi",
  gu: "gu",
};

/**
 * RTL UI locales. Empty until a ready dictionary ships for ar/ur/fa.
 * Architecture is ready — `localeDirection` + `applyDocumentLocale` honor this set.
 */
const RTL_UI_LOCALES = new Set<UiLocale>(
  UI_LOCALE_CODES.filter((code) => getLanguageByCode(code)?.dir === "rtl")
);

export function localeDirection(locale: UiLocale): "ltr" | "rtl" {
  return RTL_UI_LOCALES.has(locale) ? "rtl" : "ltr";
}

/** Direction for any registry language (including planned RTL). */
export function languageDirectionFromName(
  name: string | null | undefined
): "ltr" | "rtl" {
  return getLanguageByEnglishName(name)?.dir ?? "ltr";
}

export function isUiLocale(value: string): value is UiLocale {
  return (UI_LOCALE_CODES as readonly string[]).includes(value);
}

/**
 * Map a stored language name to a ready UI locale.
 * Planned / unknown names fall back to English (controlled — never invent a locale).
 */
export function languageNameToLocale(name: string | null | undefined): UiLocale {
  if (!name) return "en";
  const lang = getLanguageByEnglishName(name);
  if (lang && lang.uiStatus === "ready" && isUiLocale(lang.code)) {
    return lang.code;
  }
  const trimmed = name.trim().toLowerCase();
  if (trimmed === "english" || trimmed === "en") return "en";
  if (trimmed === "hindi" || trimmed === "hi" || trimmed === "हिन्दी") return "hi";
  if (trimmed === "gujarati" || trimmed === "gu" || trimmed === "ગુજરાતી")
    return "gu";
  return "en";
}

export function localeToLanguageName(locale: UiLocale): UiLanguageName {
  return LOCALE_TO_LANGUAGE[locale];
}

/**
 * Suggest a UI locale from the browser when the user has no saved choice.
 * Never overrides an explicit preference. Only ready locales are returned.
 */
export function detectBrowserUiLocale(): UiLocale {
  if (typeof navigator === "undefined") return "en";
  const candidates = [
    ...(navigator.languages ?? []),
    navigator.language,
  ].filter(Boolean);

  for (const raw of candidates) {
    const base = raw.toLowerCase().split("-")[0];
    if (base === "hi") return "hi";
    if (base === "gu") return "gu";
    if (base === "en") return "en";
  }
  return "en";
}
