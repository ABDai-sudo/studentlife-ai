import type { MessageKey } from "@/lib/i18n/dictionaries/en";
import { languageNameToLocale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/translator";
import type { UiLocale } from "@/lib/i18n/types";

/**
 * Resolve notification copy in the user's Preferred UI Language when a
 * translation exists. Falls back to English via the translator.
 */
export function notifyCopy(
  key: MessageKey,
  preferredUiLanguage: string | null | undefined,
  params?: Record<string, string | number>
): string {
  const locale: UiLocale = languageNameToLocale(preferredUiLanguage);
  return t(key, locale, params);
}
