import type { UiLocale } from "./types";
import { LOCALE_BCP47 } from "./config";

export function formatDate(
  value: Date | string | number,
  locale: UiLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(LOCALE_BCP47[locale], options).format(date);
}

export function formatNumber(
  value: number,
  locale: UiLocale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(LOCALE_BCP47[locale], options).format(value);
}

export function formatCurrency(
  value: number,
  locale: UiLocale,
  currency = "INR",
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(LOCALE_BCP47[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

/**
 * Simple plural helper for future locales.
 * English: one vs other; Hindi/Gujarati often use same form with count.
 */
export function pluralize(
  locale: UiLocale,
  count: number,
  forms: { one: string; other: string; zero?: string }
): string {
  if (count === 0 && forms.zero) return forms.zero;
  if (locale === "en") {
    return count === 1 ? forms.one : forms.other;
  }
  return count === 1 ? forms.one : forms.other;
}
