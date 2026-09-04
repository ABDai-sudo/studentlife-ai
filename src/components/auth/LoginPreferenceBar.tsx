"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useT } from "@/components/i18n/LocaleProvider";
import { UI_LOCALE_CODES, type UiLocale } from "@/lib/i18n/types";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";
import type { ThemeMode } from "@/lib/personality";

const THEME_OPTIONS: {
  value: ThemeMode;
  icon: typeof Sun;
  labelKey: MessageKey;
}[] = [
  { value: "LIGHT", icon: Sun, labelKey: "settings.themeLight" },
  { value: "DARK", icon: Moon, labelKey: "settings.themeDark" },
  { value: "SYSTEM", icon: Monitor, labelKey: "settings.themeSystem" },
];

const LOCALE_LABEL: Record<UiLocale, string> = {
  en: "EN",
  hi: "हि",
  gu: "ગુ",
};

export function LoginPreferenceBar() {
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useT();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration gate
    setMounted(true);
  }, []);

  const selectedTheme = mounted ? theme : "SYSTEM";
  const selectedLocale = mounted ? locale : "en";

  return (
    <div className="login-pref-bar">
      <div
        className="login-pref-group"
        role="radiogroup"
        aria-label={t("login.language")}
      >
        {UI_LOCALE_CODES.map((code) => {
          const selected = selectedLocale === code;
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`login-pref-chip${selected ? " is-selected" : ""}`}
              onClick={() => setLocale(code)}
            >
              {LOCALE_LABEL[code]}
            </button>
          );
        })}
      </div>
      <div
        className="login-pref-group"
        role="radiogroup"
        aria-label={t("settings.theme")}
      >
        {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => {
          const selected = selectedTheme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={t(labelKey)}
              title={t(labelKey)}
              className={`login-pref-chip login-pref-icon${selected ? " is-selected" : ""}`}
              onClick={() => setTheme(value)}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}
