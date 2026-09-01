import type { ThemeMode } from "@/lib/personality";

/** Single local persistence key — do not duplicate elsewhere. */
export const THEME_STORAGE_KEY = "sl_theme";

/** Same-tab notification when theme is written to localStorage. */
export const THEME_CHANGE_EVENT = "sl-theme-change";

/** In-memory mirror so same-tab updates work even if storage events are flaky. */
let memoryTheme: ThemeMode | null = null;
const listeners = new Set<() => void>();
/**
 * Until the first client layout effect, snapshots must match SSR (SYSTEM /
 * light) so ThemeQuickToggle and other consumers do not hydrate-mismatch.
 */
let allowClientThemeRead = false;

function notifyThemeListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* ignore subscriber errors */
    }
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "LIGHT" || value === "DARK" || value === "SYSTEM";
}

export function readStoredTheme(): ThemeMode | null {
  if (memoryTheme) return memoryTheme;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredTheme(theme: ThemeMode): void {
  memoryTheme = theme;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* private mode / blocked storage — memory + listeners still update UI */
    }
  }
  notifyThemeListeners();
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveThemeMode(theme: ThemeMode): "LIGHT" | "DARK" {
  if (theme === "SYSTEM") {
    return systemPrefersDark() ? "DARK" : "LIGHT";
  }
  return theme;
}

export function subscribeStoredTheme(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(onStoreChange);
    };
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      memoryTheme = null;
      onStoreChange();
    }
  };
  const onCustom = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onCustom);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onCustom);
  };
}

export function getStoredThemeSnapshot(fallback: ThemeMode): ThemeMode {
  if (!allowClientThemeRead) return fallback;
  return readStoredTheme() ?? fallback;
}

/** matchMedia only after hydration — server snapshot is always light/false. */
export function getSystemDarkSnapshot(): boolean {
  if (!allowClientThemeRead) return false;
  return systemPrefersDark();
}

/** Unlock localStorage / matchMedia reads after the first layout effect. */
export function enableClientThemeReads(): void {
  if (allowClientThemeRead) return;
  allowClientThemeRead = true;
  notifyThemeListeners();
}

export function subscribeSystemScheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const listener = () => onStoreChange();
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

/**
 * Inline blocking script for the root layout — keeps FOUC prevention without
 * next/script beforeInteractive (which must live in layout and is easy to misplace).
 */
export function getThemeInitScript(): string {
  return `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k)||"SYSTEM";var dark=t==="DARK"||(t==="SYSTEM"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",dark);r.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;
}
