"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import type { ThemeMode } from "@/lib/personality";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useT } from "@/components/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";

type ThemeSelectorProps = {
  onPersist?: (mode: ThemeMode) => Promise<void> | void;
  disabled?: boolean;
};

const OPTIONS: {
  value: ThemeMode;
  icon: typeof Sun;
  labelKey: MessageKey;
}[] = [
  { value: "LIGHT", icon: Sun, labelKey: "settings.themeLight" },
  { value: "DARK", icon: Moon, labelKey: "settings.themeDark" },
  { value: "SYSTEM", icon: Monitor, labelKey: "settings.themeSystem" },
];

export function ThemeSelector({ onPersist, disabled }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useT();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // First paint must match SSR; the client theme store is not available yet.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration gate
    setMounted(true);
  }, []);

  async function select(mode: ThemeMode) {
    if (disabled || mode === theme) return;
    setTheme(mode);
    await onPersist?.(mode);
  }

  const selectedTheme = mounted ? theme : "SYSTEM";

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">
        {t("settings.theme")}
      </p>
      <p className="mb-3 text-xs leading-relaxed text-muted">
        {t("settings.appearanceDesc")}
      </p>
      <div
        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        role="radiogroup"
        aria-label={t("settings.theme")}
      >
        {OPTIONS.map(({ value, icon: Icon, labelKey }) => {
          const selected = selectedTheme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => void select(value)}
              className={`flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 disabled:active:scale-100 ${
                selected
                  ? "border-primary bg-primary-soft text-foreground shadow-sm ring-1 ring-primary/15"
                  : "border-border bg-surface text-secondary hover:bg-surface-secondary hover:text-foreground"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${selected ? "text-primary" : "text-muted"}`}
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="min-w-0 font-medium leading-snug">
                {t(labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
