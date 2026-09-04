"use client";

import { useEffect, useState, type ReactNode } from "react";
import { GraduationCap, Monitor, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useT } from "@/components/i18n/LocaleProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import { UI_LOCALE_CODES, type UiLocale } from "@/lib/i18n/types";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";
import type { ThemeMode } from "@/lib/personality";

const LOCALE_LABEL: Record<UiLocale, string> = {
  en: "EN",
  hi: "हि",
  gu: "ગુ",
};

const THEME_OPTIONS: {
  value: ThemeMode;
  icon: typeof Sun;
  labelKey: MessageKey;
}[] = [
  { value: "LIGHT", icon: Sun, labelKey: "settings.themeLight" },
  { value: "DARK", icon: Moon, labelKey: "settings.themeDark" },
  { value: "SYSTEM", icon: Monitor, labelKey: "settings.themeSystem" },
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { t, locale, setLocale } = useT();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration gate
    setMounted(true);
  }, []);

  const selectedTheme = mounted ? theme : "SYSTEM";
  const selectedLocale = mounted ? locale : "en";

  return (
    <div className="auth-shell flex min-h-full flex-1 bg-background">
      <div className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden border-r border-border bg-surface p-10 xl:p-12 lg:flex">
        <Logo />
        <div className="relative max-w-md">
          <h2 className="auth-panel-title text-[1.65rem] font-semibold leading-snug text-foreground">
            {t("auth.panelTitle")}
          </h2>
          <p className="auth-panel-copy mt-3.5 max-w-sm text-base leading-[1.65] text-secondary">
            {t("auth.panelBody")}
          </p>
          <ul className="mt-8 space-y-2.5">
            {(
              [
                "auth.featureTutor",
                "auth.featureStreaks",
                "auth.featureBudget",
              ] as const
            ).map((key) => (
              <li
                key={key}
                className="border-t border-border pt-3 text-[0.9375rem] font-medium leading-snug tracking-normal text-foreground"
              >
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[0.8125rem] leading-relaxed tracking-normal text-muted">
          {t("auth.footerNote")}
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 sm:py-10">
        <div className="auth-card mx-auto w-full max-w-[26rem] rounded-2xl border border-border bg-surface p-6 shadow-md sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center sm:items-start sm:text-left">
            <div className="mb-5 lg:hidden">
              <Logo />
            </div>
            <div
              className="auth-mark mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/15 bg-primary-soft"
              aria-hidden
            >
              <GraduationCap className="h-[1.15rem] w-[1.15rem] text-primary" />
            </div>
            <h1 className="auth-title text-[1.5rem] font-semibold leading-snug text-foreground sm:text-[1.625rem]">
              {title}
            </h1>
            <p className="auth-subtitle mt-2.5 max-w-sm text-base leading-[1.65] text-secondary">
              {subtitle}
            </p>
          </div>
          <div>{children}</div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <div
              className="flex gap-1"
              role="radiogroup"
              aria-label={t("auth.language")}
            >
              {UI_LOCALE_CODES.map((code) => {
                const selected = selectedLocale === code;
                return (
                  <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-2 text-sm font-semibold ${
                      selected
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border text-secondary"
                    }`}
                    onClick={() => setLocale(code)}
                  >
                    {LOCALE_LABEL[code]}
                  </button>
                );
              })}
            </div>
            <div
              className="flex gap-1"
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
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border ${
                      selected
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border text-secondary"
                    }`}
                    onClick={() => setTheme(value)}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
