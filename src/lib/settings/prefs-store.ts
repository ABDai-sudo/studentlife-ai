export type SettingsPrefs = {
  weeklyDigest: boolean;
  expenseReminders: boolean;
  goalAlerts: boolean;
  productUpdates: boolean;
  shareAnonymousAnalytics: boolean;
};

export const DEFAULT_SETTINGS_PREFS: SettingsPrefs = Object.freeze({
  weeklyDigest: true,
  expenseReminders: true,
  goalAlerts: true,
  productUpdates: false,
  shareAnonymousAnalytics: true,
});

export const SETTINGS_PREFS_KEY = "sl_settings_prefs_v1";
const PREFS_CHANGE_EVENT = "sl-settings-prefs-change";

/** Cached immutable snapshot — same reference until prefs actually change. */
let cachedSnapshot: SettingsPrefs = DEFAULT_SETTINGS_PREFS;
let clientHydrated = false;
let allowClientPrefsRead = false;

function prefsEqual(a: SettingsPrefs, b: SettingsPrefs): boolean {
  return (
    a.weeklyDigest === b.weeklyDigest &&
    a.expenseReminders === b.expenseReminders &&
    a.goalAlerts === b.goalAlerts &&
    a.productUpdates === b.productUpdates &&
    a.shareAnonymousAnalytics === b.shareAnonymousAnalytics
  );
}

function normalizePrefs(partial: Partial<SettingsPrefs>): SettingsPrefs {
  return Object.freeze({
    weeklyDigest: partial.weeklyDigest ?? DEFAULT_SETTINGS_PREFS.weeklyDigest,
    expenseReminders:
      partial.expenseReminders ?? DEFAULT_SETTINGS_PREFS.expenseReminders,
    goalAlerts: partial.goalAlerts ?? DEFAULT_SETTINGS_PREFS.goalAlerts,
    productUpdates:
      partial.productUpdates ?? DEFAULT_SETTINGS_PREFS.productUpdates,
    shareAnonymousAnalytics:
      partial.shareAnonymousAnalytics ??
      DEFAULT_SETTINGS_PREFS.shareAnonymousAnalytics,
  });
}

function readPrefsFromStorage(): SettingsPrefs {
  if (typeof window === "undefined") return DEFAULT_SETTINGS_PREFS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_PREFS_KEY);
    if (!raw) return DEFAULT_SETTINGS_PREFS;
    const parsed = JSON.parse(raw) as Partial<SettingsPrefs>;
    return normalizePrefs(parsed);
  } catch {
    return DEFAULT_SETTINGS_PREFS;
  }
}

/** Refresh cache from storage; returns true if the snapshot reference changed. */
function syncCacheFromStorage(): boolean {
  const next = readPrefsFromStorage();
  if (prefsEqual(cachedSnapshot, next)) {
    return false;
  }
  cachedSnapshot = next;
  return true;
}

function ensureClientHydrated(): void {
  if (clientHydrated || typeof window === "undefined") return;
  syncCacheFromStorage();
  clientHydrated = true;
}

export function getSettingsPrefsSnapshot(): SettingsPrefs {
  if (!allowClientPrefsRead) return cachedSnapshot;
  ensureClientHydrated();
  return cachedSnapshot;
}

export function getServerSettingsPrefsSnapshot(): SettingsPrefs {
  return DEFAULT_SETTINGS_PREFS;
}

/** Read localStorage only after hydration of SettingsClient. */
export function enableClientSettingsPrefsReads(): void {
  if (allowClientPrefsRead) return;
  allowClientPrefsRead = true;
  ensureClientHydrated();
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new Event(PREFS_CHANGE_EVENT));
    } catch {
      /* ignore */
    }
  }
}

export function writeSettingsPrefs(next: SettingsPrefs): void {
  const normalized = normalizePrefs(next);
  if (prefsEqual(cachedSnapshot, normalized)) {
    return;
  }
  cachedSnapshot = normalized;
  clientHydrated = true;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SETTINGS_PREFS_KEY,
      JSON.stringify(normalized)
    );
    window.dispatchEvent(new Event(PREFS_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

export function subscribeSettingsPrefs(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key !== SETTINGS_PREFS_KEY && event.key !== null) return;
    if (syncCacheFromStorage()) {
      onStoreChange();
    }
  };

  const onLocalChange = () => {
    // Cache already updated in writeSettingsPrefs before this event.
    onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(PREFS_CHANGE_EVENT, onLocalChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PREFS_CHANGE_EVENT, onLocalChange);
  };
}
