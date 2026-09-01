"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

const TOGGLE_CLASS =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-secondary transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * Quick Light ↔ Dark toggle for authenticated chrome.
 * Full Light / Dark / System remains in Settings.
 *
 * First paint is theme-agnostic so SSR HTML matches hydration: root
 * ThemeProvider always SSRs as SYSTEM/light, while the client store may
 * already be DARK from a previous page.
 */
export function ThemeQuickToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // First paint must match SSR; the client theme store is not available yet.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration gate
    setMounted(true);
  }, []);

  function toggle() {
    const next = resolvedTheme === "DARK" ? "LIGHT" : "DARK";
    setTheme(next);
    // Persist for signed-in users when possible; ignore failures (e.g. offline).
    void fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeMode: next }),
    }).catch(() => undefined);
  }

  if (!mounted) {
    return (
      <button
        type="button"
        className={`${TOGGLE_CLASS} ${className}`}
        aria-label="Switch theme"
        title="Switch theme"
      >
        <Moon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>
    );
  }

  const isDark = resolvedTheme === "DARK";
  const label =
    theme === "SYSTEM"
      ? isDark
        ? "Switch to light theme (currently following device)"
        : "Switch to dark theme (currently following device)"
      : isDark
        ? "Switch to light theme"
        : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      className={`${TOGGLE_CLASS} ${className}`}
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}
