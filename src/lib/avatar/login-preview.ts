/**
 * Login-page preview identities.
 * Curated, mature college-age looks — not an editor, not gender-coded art.
 * Saved identity is remembered locally after authentication for the Custom slot.
 */

import { isValidAvatarPresetId } from "@/lib/avatar/presets";

export const LOGIN_PRESENTATIONS = [
  "male",
  "female",
  "neutral",
  "custom",
] as const;

export type LoginPresentationId = (typeof LOGIN_PRESENTATIONS)[number];

/**
 * Local cinematic stills for the login stage only.
 * Release files in /public/login. Commissioned replacements should keep
 * these exact filenames:
 *   public/login/student-male.png
 *   public/login/student-female.png
 *   public/login/student-neutral.png
 *   public/login/student-custom.png
 *   public/login/campus-dusk.png
 */
export const LOGIN_ARTWORK = {
  male: "/login/student-male.png",
  female: "/login/student-female.png",
  neutral: "/login/student-neutral.png",
  custom: "/login/student-custom.png",
  campus: "/login/campus-dusk.png",
} as const;

export type LoginPreviewIdentity = {
  presentation: LoginPresentationId;
  presetId: string | null;
  displayName: string;
  artworkSrc: string;
};

export type LoginRememberedContext = {
  presentation?: LoginPresentationId;
  savedPresetId?: string | null;
  savedDisplayName?: string | null;
  examWeekHint?: boolean;
  broModeHint?: boolean;
};

export const LOGIN_PREVIEW_STORAGE_KEY = "sl_login_preview_v1";
const LOGIN_PREVIEW_EVENT = "sl-login-preview-change";

const EMPTY_LOGIN_CONTEXT: LoginRememberedContext = Object.freeze({});
let cachedSnapshot: LoginRememberedContext = EMPTY_LOGIN_CONTEXT;
let cachedRaw: string | null | undefined = undefined;
const listeners = new Set<() => void>();

function notifyLoginContext() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* ignore */
    }
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LOGIN_PREVIEW_EVENT));
  }
}

/** Curated looks: mixed identity tokens, not pink/blue gender-coded art. */
export const CURATED_LOGIN_PREVIEWS: Record<
  Exclude<LoginPresentationId, "custom">,
  LoginPreviewIdentity
> = {
  male: {
    presentation: "male",
    presetId: "midnight",
    displayName: "Arjun",
    artworkSrc: LOGIN_ARTWORK.male,
  },
  female: {
    presentation: "female",
    presetId: "jade",
    displayName: "Meera",
    artworkSrc: LOGIN_ARTWORK.female,
  },
  neutral: {
    presentation: "neutral",
    presetId: "slate",
    displayName: "Jordan",
    artworkSrc: LOGIN_ARTWORK.neutral,
  },
};

const FALLBACK_CUSTOM: LoginPreviewIdentity = {
  presentation: "custom",
  presetId: "cobalt",
  displayName: "Student",
  artworkSrc: LOGIN_ARTWORK.custom,
};

export function isLoginPresentationId(
  value: unknown
): value is LoginPresentationId {
  return (
    typeof value === "string" &&
    (LOGIN_PRESENTATIONS as readonly string[]).includes(value)
  );
}

export function sanitizeStoredName(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.length > 48) return null;
  if (!/^[\p{L}\p{M}0-9 .,'&()-]+$/u.test(trimmed)) return null;
  return trimmed;
}

export function resolveLoginPreview(
  presentation: LoginPresentationId,
  remembered: LoginRememberedContext = {}
): LoginPreviewIdentity {
  if (presentation !== "custom") {
    return CURATED_LOGIN_PREVIEWS[presentation];
  }

  const presetId = isValidAvatarPresetId(remembered.savedPresetId)
    ? remembered.savedPresetId!
    : remembered.savedPresetId === null
      ? null
      : FALLBACK_CUSTOM.presetId;
  const displayName =
    sanitizeStoredName(remembered.savedDisplayName) ?? FALLBACK_CUSTOM.displayName;

  if (!remembered.savedPresetId && !remembered.savedDisplayName) {
    return FALLBACK_CUSTOM;
  }

  return {
    presentation: "custom",
    presetId,
    displayName,
    artworkSrc: LOGIN_ARTWORK.custom,
  };
}

export function parseLoginRememberedContext(
  raw: unknown
): LoginRememberedContext {
  if (!raw || typeof raw !== "object") return {};
  const value = raw as Record<string, unknown>;
  const next: LoginRememberedContext = {};

  if (isLoginPresentationId(value.presentation)) {
    next.presentation = value.presentation;
  }
  if (value.savedPresetId === null) {
    next.savedPresetId = null;
  } else if (
    typeof value.savedPresetId === "string" &&
    isValidAvatarPresetId(value.savedPresetId)
  ) {
    next.savedPresetId = value.savedPresetId;
  }
  const name = sanitizeStoredName(
    typeof value.savedDisplayName === "string" ? value.savedDisplayName : null
  );
  if (name) next.savedDisplayName = name;
  if (typeof value.examWeekHint === "boolean") {
    next.examWeekHint = value.examWeekHint;
  }
  if (typeof value.broModeHint === "boolean") {
    next.broModeHint = value.broModeHint;
  }
  return next;
}

export function readLoginContext(): LoginRememberedContext {
  if (typeof window === "undefined") return EMPTY_LOGIN_CONTEXT;
  try {
    const raw = window.localStorage.getItem(LOGIN_PREVIEW_STORAGE_KEY);
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    cachedSnapshot = raw
      ? Object.freeze(parseLoginRememberedContext(JSON.parse(raw)))
      : EMPTY_LOGIN_CONTEXT;
    return cachedSnapshot;
  } catch {
    cachedRaw = null;
    cachedSnapshot = EMPTY_LOGIN_CONTEXT;
    return EMPTY_LOGIN_CONTEXT;
  }
}

export function rememberLoginContext(
  partial: LoginRememberedContext
): LoginRememberedContext {
  const prev = readLoginContext();
  const next: LoginRememberedContext = { ...prev };

  if (partial.presentation !== undefined) {
    next.presentation = partial.presentation;
  }
  if (partial.savedPresetId !== undefined) {
    next.savedPresetId = isValidAvatarPresetId(partial.savedPresetId)
      ? partial.savedPresetId
      : partial.savedPresetId === null
        ? null
        : prev.savedPresetId;
  }
  if (partial.savedDisplayName !== undefined) {
    next.savedDisplayName =
      sanitizeStoredName(partial.savedDisplayName) ??
      (partial.savedDisplayName === null ? undefined : prev.savedDisplayName);
  }
  if (partial.examWeekHint !== undefined) {
    next.examWeekHint = partial.examWeekHint;
  }
  if (partial.broModeHint !== undefined) {
    next.broModeHint = partial.broModeHint;
  }

  if (typeof window !== "undefined") {
    try {
      const serialized = JSON.stringify(next);
      window.localStorage.setItem(LOGIN_PREVIEW_STORAGE_KEY, serialized);
      cachedRaw = serialized;
      cachedSnapshot = Object.freeze(next);
    } catch {
      cachedSnapshot = Object.freeze(next);
    }
    notifyLoginContext();
  }
  return next;
}

export function subscribeLoginContext(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(onStoreChange);
    };
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key !== LOGIN_PREVIEW_STORAGE_KEY && event.key !== null) return;
    cachedRaw = undefined;
    onStoreChange();
  };
  const onLocal = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(LOGIN_PREVIEW_EVENT, onLocal);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LOGIN_PREVIEW_EVENT, onLocal);
  };
}

export function getServerLoginContextSnapshot(): LoginRememberedContext {
  return EMPTY_LOGIN_CONTEXT;
}
