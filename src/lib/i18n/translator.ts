import type { MessageParams, UiLocale } from "./types";
import type { MessageKey } from "./dictionaries/en";
import { en } from "./dictionaries/en";
import { hi } from "./dictionaries/hi";
import { gu } from "./dictionaries/gu";

const dictionaries: Record<UiLocale, Record<MessageKey, string>> = {
  en,
  hi,
  gu,
};

const warnedKeys = new Set<string>();

function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? `{${key}}` : String(value);
  });
}

/**
 * Translate a stable key. Missing keys fall back to English.
 * Never returns the raw key to users.
 */
export function t(
  key: MessageKey,
  locale: UiLocale = "en",
  params?: MessageParams
): string {
  const primary = dictionaries[locale]?.[key];
  if (primary) return interpolate(primary, params);

  const fallback = en[key];
  if (fallback) {
    if (
      process.env.NODE_ENV === "development" &&
      typeof console !== "undefined" &&
      !warnedKeys.has(`${locale}:${key}`)
    ) {
      warnedKeys.add(`${locale}:${key}`);
      console.warn(`[i18n] Missing translation for "${key}" in locale "${locale}"`);
    }
    return interpolate(fallback, params);
  }

  if (
    process.env.NODE_ENV === "development" &&
    typeof console !== "undefined" &&
    !warnedKeys.has(`missing:${key}`)
  ) {
    warnedKeys.add(`missing:${key}`);
    console.warn(`[i18n] Unknown translation key "${key}"`);
  }
  // Never surface raw keys like "nav.overview" to users.
  return interpolate(en["errors.generic"] ?? "Something went wrong.", params);
}

export function getDictionary(locale: UiLocale): Record<MessageKey, string> {
  return dictionaries[locale] ?? en;
}
