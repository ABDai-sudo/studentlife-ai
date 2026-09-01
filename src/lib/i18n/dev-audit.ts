import { en, type MessageKey } from "./dictionaries/en";
import { hi } from "./dictionaries/hi";
import { gu } from "./dictionaries/gu";
import type { UiLocale } from "./types";

/**
 * Development audit: list keys present in English but missing/empty in other locales.
 */
export function auditMissingTranslations(): Record<
  Exclude<UiLocale, "en">,
  MessageKey[]
> {
  const enKeys = Object.keys(en) as MessageKey[];
  const missing: Record<Exclude<UiLocale, "en">, MessageKey[]> = {
    hi: [],
    gu: [],
  };

  for (const key of enKeys) {
    if (!hi[key]?.trim()) missing.hi.push(key);
    if (!gu[key]?.trim()) missing.gu.push(key);
  }

  return missing;
}

export function logTranslationAudit(): void {
  if (process.env.NODE_ENV !== "development") return;
  const missing = auditMissingTranslations();
  const hiCount = missing.hi.length;
  const guCount = missing.gu.length;
  if (hiCount || guCount) {
    console.warn(
      `[i18n audit] missing keys — hi: ${hiCount}, gu: ${guCount}`,
      missing
    );
  }
}
