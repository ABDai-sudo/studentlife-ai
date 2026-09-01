import type { UiLocale } from "./types";
import {
  detectBrowserUiLocale,
  isUiLocale,
  languageNameToLocale,
  localeToLanguageName,
} from "./config";

export const UI_LOCALE_KEY = "sl_ui_locale";
export const UI_LOCALE_EXPLICIT_KEY = "sl_ui_locale_explicit";
const LOCALE_CHANGE_EVENT = "sl-ui-locale-change";

const DEFAULT_LOCALE: UiLocale = "en";

/** Cached primitive snapshot — same reference until locale actually changes. */
let cachedLocale: UiLocale = DEFAULT_LOCALE;
let clientHydrated = false;
/**
 * Until the first client layout effect, getUiLocaleSnapshot must match
 * getServerUiLocaleSnapshot so React hydration does not mismatch.
 */
let allowClientLocaleRead = false;
/**
 * Server-render preferred locale from profile (set synchronously during RSC/client SSR).
 * Keeps useSyncExternalStore getServerSnapshot aligned with hydrated client locale.
 */
let serverPreferredLocale: UiLocale = DEFAULT_LOCALE;
/** When true, profile hydrate may override local storage. */
let allowProfileHydrate = true;

function readLocaleFromStorage(): UiLocale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(UI_LOCALE_KEY);
    if (raw && isUiLocale(raw)) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

function hasExplicitChoice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(UI_LOCALE_EXPLICIT_KEY) === "1";
  } catch {
    return false;
  }
}

function resolveInitialClientLocale(): UiLocale {
  const stored = readLocaleFromStorage();
  if (stored) return stored;
  if (hasExplicitChoice()) return DEFAULT_LOCALE;
  return detectBrowserUiLocale();
}

function ensureClientHydrated(): void {
  if (clientHydrated || typeof window === "undefined") return;
  cachedLocale = resolveInitialClientLocale();
  clientHydrated = true;
}

export function getUiLocaleSnapshot(): UiLocale {
  // During SSR/hydration, mirror the server snapshot (do not read localStorage yet).
  if (typeof window === "undefined" || !allowClientLocaleRead) {
    return serverPreferredLocale;
  }
  ensureClientHydrated();
  return cachedLocale;
}

export function getServerUiLocaleSnapshot(fallback?: UiLocale): UiLocale {
  return fallback ?? serverPreferredLocale;
}

/**
 * Call once from a client layout effect after hydration so localStorage/profile
 * can drive the live locale without a hydration warning.
 */
export function enableClientLocaleReads(): void {
  if (allowClientLocaleRead) return;
  const previous = serverPreferredLocale;
  allowClientLocaleRead = true;
  ensureClientHydrated();
  if (
    cachedLocale !== previous &&
    typeof window !== "undefined"
  ) {
    try {
      window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
    } catch {
      /* ignore */
    }
  }
}

/**
 * Call during SSR/render of authenticated layouts so getServerSnapshot matches profile.
 */
export function setServerPreferredUiLanguage(
  preferredUiLanguage: string | null | undefined
): void {
  const next = preferredUiLanguage
    ? languageNameToLocale(preferredUiLanguage)
    : DEFAULT_LOCALE;
  serverPreferredLocale = next;
  // Newly hydrated Sidebar/header trees must see the same locale the RSC
  // payload was rendered with. Do not dispatch — this runs during render.
  cachedLocale = next;
}

export function writeUiLocale(
  next: UiLocale,
  options?: { explicit?: boolean; fromProfile?: boolean }
): void {
  const explicit = options?.explicit !== false;
  if (cachedLocale === next && clientHydrated && !options?.fromProfile) {
    if (explicit && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(UI_LOCALE_EXPLICIT_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    return;
  }

  cachedLocale = next;
  clientHydrated = true;
  allowClientLocaleRead = true;
  allowProfileHydrate = false;

  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UI_LOCALE_KEY, next);
    if (explicit) {
      window.localStorage.setItem(UI_LOCALE_EXPLICIT_KEY, "1");
    }
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

/**
 * Apply server profile preferredUiLanguage (display name).
 * Does not mark as "user just changed" — syncs across devices after login.
 */
export function hydrateUiLocaleFromProfile(
  preferredUiLanguage: string | null | undefined
): void {
  if (!preferredUiLanguage) return;
  const locale = languageNameToLocale(preferredUiLanguage);
  // Profile is source of truth when signed in.
  allowClientLocaleRead = true;
  if (cachedLocale === locale && clientHydrated) return;
  cachedLocale = locale;
  clientHydrated = true;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UI_LOCALE_KEY, locale);
    window.localStorage.setItem(UI_LOCALE_EXPLICIT_KEY, "1");
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
  void allowProfileHydrate;
}

export function writeUiLocaleFromLanguageName(
  languageName: string,
  options?: { explicit?: boolean }
): void {
  writeUiLocale(languageNameToLocale(languageName), {
    explicit: options?.explicit !== false,
  });
}

export function getUiLanguageNameSnapshot(): string {
  return localeToLanguageName(getUiLocaleSnapshot());
}

export function subscribeUiLocale(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key !== UI_LOCALE_KEY && event.key !== null) return;
    const next = readLocaleFromStorage();
    if (next && next !== cachedLocale) {
      cachedLocale = next;
      onStoreChange();
    }
  };

  const onLocalChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(LOCALE_CHANGE_EVENT, onLocalChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LOCALE_CHANGE_EVENT, onLocalChange);
  };
}
