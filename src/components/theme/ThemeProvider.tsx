"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { PersonalityMode, ThemeMode } from "@/lib/personality";
import {
  enableClientThemeReads,
  getStoredThemeSnapshot,
  getSystemDarkSnapshot,
  readStoredTheme,
  subscribeStoredTheme,
  subscribeSystemScheme,
  systemPrefersDark,
  writeStoredTheme,
} from "@/lib/theme/storage";
import {
  getPersonalitySnapshot,
  getServerPersonalitySnapshot,
  setPersonalityStore,
  subscribePersonalityStore,
} from "@/lib/theme/personality-store";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  personality: PersonalityMode;
  setPersonality: (mode: PersonalityMode) => void;
  resolvedTheme: "LIGHT" | "DARK";
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyDocumentTheme(
  theme: ThemeMode,
  personality: PersonalityMode
) {
  const root = document.documentElement;
  const resolved =
    theme === "SYSTEM" ? (systemPrefersDark() ? "DARK" : "LIGHT") : theme;
  const isDark = resolved === "DARK";
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
  root.dataset.personality = personality;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", isDark ? "#0b1220" : "#f7f9fc");
  }
}

type ThemeProviderProps = {
  children: ReactNode;
  /** Server/default preference when no local value exists */
  initialTheme?: ThemeMode;
  initialPersonality?: PersonalityMode;
};

export function ThemeProvider({
  children,
  initialTheme = "SYSTEM",
  initialPersonality = "PROFESSIONAL",
}: ThemeProviderProps) {
  // External stores avoid react-hooks/set-state-in-effect for preference sync.
  // FOUC script already painted the correct class before React boots.
  const theme = useSyncExternalStore(
    subscribeStoredTheme,
    () => getStoredThemeSnapshot(initialTheme),
    () => initialTheme
  );

  const systemDark = useSyncExternalStore(
    subscribeSystemScheme,
    getSystemDarkSnapshot,
    () => false
  );

  const personality = useSyncExternalStore(
    subscribePersonalityStore,
    () => getPersonalitySnapshot(initialPersonality),
    () => getServerPersonalitySnapshot(initialPersonality)
  );

  const resolvedTheme: "LIGHT" | "DARK" =
    theme === "SYSTEM" ? (systemDark ? "DARK" : "LIGHT") : theme;

  useLayoutEffect(() => {
    enableClientThemeReads();
  }, []);

  useLayoutEffect(() => {
    applyDocumentTheme(theme, personality);
  }, [theme, personality, resolvedTheme]);

  const setTheme = useCallback((next: ThemeMode) => {
    writeStoredTheme(next);
  }, []);

  const setPersonality = useCallback((next: PersonalityMode) => {
    setPersonalityStore(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      personality,
      setPersonality,
      resolvedTheme,
    }),
    [theme, setTheme, personality, setPersonality, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Sync server-persisted preferences into external stores (no React setState).
 * Seeds local theme only once per mount when storage is empty so an in-progress
 * Light/Dark choice is not wiped by a still-stale SSR theme prop.
 */
export function PreferencesHydrator({
  theme,
  personality,
}: {
  theme?: ThemeMode;
  personality?: PersonalityMode;
}) {
  const seeded = useRef(false);
  useLayoutEffect(() => {
    if (!seeded.current && theme && !readStoredTheme()) {
      writeStoredTheme(theme);
      seeded.current = true;
    } else if (!seeded.current) {
      seeded.current = true;
    }
    if (personality) {
      setPersonalityStore(personality);
    }
  }, [theme, personality]);

  return null;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

/** Optional hook that returns null outside the provider (e.g. rare edge routes). */
export function useThemeOptional() {
  return useContext(ThemeContext);
}
