"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, Landmark, Monitor, Moon, Sun, TrendingUp, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useT } from "@/components/i18n/LocaleProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import { UI_LOCALE_CODES, type UiLocale } from "@/lib/i18n/types";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";
import type { ThemeMode } from "@/lib/personality";
import { LOGIN_ARTWORK } from "@/lib/avatar/login-preview";

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

const PILLARS: {
  icon: typeof BookOpen;
  labelKey: MessageKey;
}[] = [
  { icon: BookOpen, labelKey: "auth.pillar.study" },
  { icon: Wallet, labelKey: "auth.pillar.money" },
  { icon: Landmark, labelKey: "auth.pillar.campus" },
  { icon: TrendingUp, labelKey: "auth.pillar.progress" },
];

export function AuthShell({
  title,
  subtitle,
  progress,
  children,
}: {
  title: string;
  subtitle: string;
  progress?: { step: number; labels: string[] };
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
    <div className="auth-premium">
      <aside className="auth-premium-brand" aria-hidden={false}>
        <div className="auth-premium-brand-media" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGIN_ARTWORK.campus}
            alt=""
            className="auth-premium-campus"
            width={768}
            height={1024}
            decoding="async"
          />
          <div className="auth-premium-brand-scrim" />
        </div>

        <div className="auth-premium-brand-content">
          <Logo light className="auth-premium-logo" />
          <div className="auth-premium-brand-copy">
            <p className="auth-premium-kicker">{t("auth.brandKicker")}</p>
            <h2 className="auth-premium-headline">{t("auth.panelTitle")}</h2>
            <p className="auth-premium-lede">{t("auth.panelBody")}</p>
            <ul className="auth-premium-pillars">
              {PILLARS.map(({ icon: Icon, labelKey }) => (
                <li key={labelKey}>
                  <span className="auth-premium-pillar-icon" aria-hidden>
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span>{t(labelKey)}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="auth-premium-footnote">{t("auth.footerNote")}</p>
        </div>
      </aside>

      <section className="auth-premium-form-pane">
        <div className="auth-premium-mobile-hero lg:hidden">
          <Logo />
          <p className="auth-premium-mobile-kicker">{t("auth.brandKicker")}</p>
        </div>

        <div className="auth-premium-card auth-card">
          {progress ? (
            <div
              className="auth-progress"
              role="group"
              aria-label={t("signup.progressLabel")}
            >
              <ol className="auth-progress-list">
                {progress.labels.map((label, index) => {
                  const step = index + 1;
                  const state =
                    step < progress.step
                      ? "done"
                      : step === progress.step
                        ? "current"
                        : "upcoming";
                  return (
                    <li
                      key={label}
                      className="auth-progress-item"
                      data-state={state}
                      aria-current={state === "current" ? "step" : undefined}
                    >
                      <span className="auth-progress-index" aria-hidden>
                        {step}
                      </span>
                      <span className="auth-progress-label">{label}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}

          <header className="auth-premium-header">
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
          </header>

          <div className="auth-premium-body">{children}</div>

          <div className="auth-premium-controls">
            <div
              className="auth-control-group"
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
                    className={`auth-control-chip${selected ? " is-selected" : ""}`}
                    onClick={() => setLocale(code)}
                  >
                    {LOCALE_LABEL[code]}
                  </button>
                );
              })}
            </div>
            <div
              className="auth-control-group"
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
                    className={`auth-control-chip auth-control-icon${selected ? " is-selected" : ""}`}
                    onClick={() => setTheme(value)}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
