"use client";

import Link from "next/link";
import {
  type FormEvent,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  Building2,
  Globe2,
  Lock,
  Mail,
  Palette,
  Shield,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { LogoutButton } from "@/components/app/LogoutButton";
import { COMPANY } from "@/lib/company";
import { useTheme } from "@/components/theme/ThemeProvider";
import { ThemeSelector } from "@/components/theme/ThemeSelector";
import {
  PERSONALITY_MODES,
  type PersonalityMode,
} from "@/lib/personality";
import { seriousCopy } from "@/lib/personality/copy";
import { PERSONALITY_LABELS } from "@/lib/languages";
import {
  getExplanationLanguages,
  getUiLanguagePickerList,
  isReadyUiLanguageName,
} from "@/lib/i18n/languages-registry";
import {
  enableClientSettingsPrefsReads,
  getServerSettingsPrefsSnapshot,
  getSettingsPrefsSnapshot,
  subscribeSettingsPrefs,
  writeSettingsPrefs,
  type SettingsPrefs,
} from "@/lib/settings/prefs-store";
import { useT } from "@/components/i18n/LocaleProvider";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { PersonalityVibeCard } from "@/components/i18n/PersonalityVibeCard";
import { EngagementSettings } from "@/components/settings/EngagementSettings";
import { t as translate } from "@/lib/i18n/translator";
import { languageNameToLocale } from "@/lib/i18n/config";

type InitialProfile = {
  currency: string;
  country: string;
  timezone: string;
  studentType: string;
  monthlyPocketMoney: number | null;
  preferredExplanationLang: string | null;
  preferredUiLanguage: string | null;
  displayName: string | null;
  leaderboardOptIn: boolean;
  leaderboardShowAvatar: boolean;
  avatarPresetId: string | null;
  avatarStatus: string | null;
};

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "America/Toronto",
  "Australia/Sydney",
];

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs text-muted">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 start-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SettingsClient({
  email,
  name,
  plan,
  initialProfile,
  initialNotifPrefs = null,
}: {
  email: string;
  name: string | null;
  plan: string;
  initialProfile: InitialProfile | null;
  initialNotifPrefs?: {
    pauseAll: boolean;
    streakAtRisk: boolean;
    streakFinalReminder: boolean;
    dailyQuests: boolean;
    assignmentDeadline: boolean;
    upcomingExam: boolean;
    overspending: boolean;
    savingsGoal: boolean;
    weeklyRecap: boolean;
    lowMoney: boolean;
  } | null;
}) {
  const { setPersonality, personality } = useTheme();
  const { t, setLocaleFromLanguageName } = useT();
  const [mounted, setMounted] = useState(false);

  // Server-provided profile seeds form state — no mount-effect hydration.
  const [profile, setProfile] = useState<InitialProfile | null>(initialProfile);
  const [currency, setCurrency] = useState(initialProfile?.currency || "INR");
  const [country, setCountry] = useState(initialProfile?.country || "IN");
  const [timezone, setTimezone] = useState(
    initialProfile?.timezone || "Asia/Kolkata"
  );
  const [explainLang, setExplainLang] = useState(
    initialProfile?.preferredExplanationLang || "English"
  );
  const [uiLang, setUiLang] = useState(
    initialProfile?.preferredUiLanguage || "English"
  );

  const prefs = useSyncExternalStore(
    subscribeSettingsPrefs,
    getSettingsPrefsSnapshot,
    getServerSettingsPrefsSnapshot
  );

  useLayoutEffect(() => {
    enableClientSettingsPrefsReads();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration gate
    setMounted(true);
  }, []);

  const displayPersonality = mounted ? personality : "PROFESSIONAL";

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function savePrefs(next: SettingsPrefs) {
    writeSettingsPrefs(next);
  }

  async function onSaveRegion(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency, country, timezone }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || t("errors.saveFailed"));
        return;
      }
      setProfile(json.data.profile);
      setMsg(t("settings.saved"));
    } catch {
      setError(t("errors.network"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Section
        icon={UserRound}
        title={t("settings.account")}
        description={t("settings.accountDesc")}
      >
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <dt className="text-muted">{t("settings.name")}</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {name ?? t("settings.notSet")}
              </dd>
            </div>
            <span className="rounded-md border border-border bg-surface-secondary px-2 py-1 text-xs font-medium text-secondary">
              {plan} {t("settings.plan").toLowerCase()}
            </span>
          </div>
          <div>
            <dt className="text-muted">{t("settings.email")}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{email}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button href="/dashboard/profile" variant="secondary" size="sm">
            {t("settings.editProfile")}
          </Button>
        </div>
      </Section>

      <Section
        icon={Globe2}
        title={t("settings.region")}
        description={t("settings.regionDesc")}
      >
        <form onSubmit={onSaveRegion} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="currency" label={t("settings.currency")}>
              <select
                id="currency"
                className="field-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="EUR">EUR — Euro</option>
                <option value="AED">AED — UAE Dirham</option>
              </select>
            </FormField>
            <FormField id="country" label={t("settings.country")}>
              <select
                id="country"
                className="field-input"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="IN">India</option>
                <option value="AE">United Arab Emirates</option>
                <option value="UK">United Kingdom</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
              </select>
            </FormField>
          </div>
          <FormField id="timezone" label={t("settings.timezone")}>
            <select
              id="timezone"
              className="field-input"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </FormField>
          {profile?.monthlyPocketMoney == null ? (
            <p className="text-xs text-muted">
              {t("settings.pocketUnset")}{" "}
              <Link href="/dashboard/profile" className="text-primary underline">
                {t("settings.addInProfile")}
              </Link>
            </p>
          ) : null}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? t("loading.generic") : t("actions.save")}
          </Button>
        </form>
      </Section>

      <Section
        icon={Palette}
        title={t("settings.appearance")}
        description={t("settings.languageDesc")}
      >
        <div className="space-y-4">
          <FormField
            id="explainLang"
            label={t("settings.explanationLanguage")}
            hint={t("settings.explanationLanguageHint")}
          >
            <LanguageSelector
              id="explainLang"
              value={explainLang}
              options={getExplanationLanguages()}
              disabled={saving}
              onlyReadySelectable={false}
              searchPlaceholder={t("settings.languageSearch")}
              comingSoonLabel={t("settings.languageComingSoon")}
              onChange={async (value) => {
                setExplainLang(value);
                setSaving(true);
                setError(null);
                try {
                  const res = await fetch("/api/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      preferredExplanationLang: value,
                    }),
                  });
                  const json = await res.json().catch(() => null);
                  if (!res.ok || !json?.success) {
                    setError(json?.error?.message || t("errors.generic"));
                    return;
                  }
                  setMsg(t("toast.saved"));
                } catch {
                  setError(t("errors.network"));
                } finally {
                  setSaving(false);
                }
              }}
            />
          </FormField>

          <FormField
            id="uiLang"
            label={t("settings.uiLanguage")}
            hint={t("settings.uiLanguageHint")}
          >
            <LanguageSelector
              id="uiLang"
              value={uiLang}
              options={getUiLanguagePickerList()}
              disabled={saving}
              onlyReadySelectable
              searchPlaceholder={t("settings.languageSearch")}
              comingSoonLabel={t("settings.languageComingSoon")}
              onChange={async (value) => {
                if (!isReadyUiLanguageName(value)) return;
                setUiLang(value);
                setLocaleFromLanguageName(value);
                setSaving(true);
                setError(null);
                try {
                  const res = await fetch("/api/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ preferredUiLanguage: value }),
                  });
                  const json = await res.json().catch(() => null);
                  if (!res.ok || !json?.success) {
                    setError(json?.error?.message || t("errors.generic"));
                    return;
                  }
                  setMsg(
                    translate(
                      "settings.languageUpdated",
                      languageNameToLocale(value)
                    )
                  );
                } catch {
                  setError(t("errors.network"));
                } finally {
                  setSaving(false);
                }
              }}
            />
          </FormField>

          <PersonalityVibeCard
            personality={displayPersonality}
            title={t("settings.appVibe")}
            hint={t("settings.appVibeHint")}
            editLabel={t("settings.editTone")}
            editHref="#personality"
          />

          <div id="personality" className="scroll-mt-24 space-y-4">
          <FormField
            id="personalitySelect"
            label={t("settings.personality")}
            hint={t("settings.personalityHint")}
          >
            <select
              id="personalitySelect"
              className="field-input"
              value={displayPersonality}
              onChange={async (e) => {
                const mode = e.target.value as PersonalityMode;
                setPersonality(mode);
                setSaving(true);
                setError(null);
                try {
                  const res = await fetch("/api/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ personalityMode: mode }),
                  });
                  const json = await res.json().catch(() => null);
                  if (!res.ok || !json?.success) {
                    setError(json?.error?.message || t("errors.generic"));
                    return;
                  }
                  setMsg(t("toast.saved"));
                } catch {
                  setError(t("errors.network"));
                } finally {
                  setSaving(false);
                }
              }}
            >
              {PERSONALITY_MODES.map((m) => (
                <option key={m} value={m}>
                  {PERSONALITY_LABELS[m] || m}
                </option>
              ))}
            </select>
          </FormField>
          </div>

          <ThemeSelector
            disabled={saving}
            onPersist={async (mode) => {
              setSaving(true);
              setError(null);
              try {
                const res = await fetch("/api/profile", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ themeMode: mode }),
                });
                const json = await res.json().catch(() => null);
                if (!res.ok || !json?.success) {
                  setError(json?.error?.message || t("errors.generic"));
                  return;
                }
                setMsg(t("toast.saved"));
              } catch {
                setError(t("errors.network"));
              } finally {
                setSaving(false);
              }
            }}
          />

          <div className="rounded-lg border border-border bg-surface-secondary/50 px-3 py-2 text-xs text-muted">
            {t("settings.collegeLinkLead")}{" "}
            <Link href="/dashboard/profile" className="text-primary underline">
              {t("nav.profile")}
            </Link>
            . {t("settings.gamesLinkLead")}{" "}
            <Link href="/dashboard/games" className="text-primary underline">
              {t("nav.games")}
            </Link>
            .
          </div>
        </div>
      </Section>

      <EngagementSettings
        initialSocial={{
          displayName: initialProfile?.displayName ?? name ?? "",
          leaderboardOptIn: initialProfile?.leaderboardOptIn ?? false,
          leaderboardShowAvatar: initialProfile?.leaderboardShowAvatar ?? true,
          avatarPresetId: initialProfile?.avatarPresetId ?? null,
          avatarStatus: initialProfile?.avatarStatus ?? null,
        }}
        initialPrefs={initialNotifPrefs}
        onMessage={(m) => setMsg(m)}
        onError={(e) => setError(e)}
      />

      <Section
        icon={Shield}
        title={t("settings.privacy")}
        description={seriousCopy.privacyBody}
      >
        <div className="divide-y divide-border">
          <Toggle
            checked={prefs.shareAnonymousAnalytics}
            onChange={(v) =>
              savePrefs({ ...prefs, shareAnonymousAnalytics: v })
            }
            label={t("settings.analytics")}
            description={t("settings.analyticsDesc")}
          />
          <Toggle
            checked={prefs.productUpdates}
            onChange={(v) => savePrefs({ ...prefs, productUpdates: v })}
            label={t("settings.notifProduct")}
            description={t("settings.notifProductDesc")}
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          We do not sell personal data. Budgeting guidance only — not banking or
          credit advice.
        </p>
      </Section>

      <Section
        icon={Lock}
        title={t("settings.security")}
        description={t("settings.securityDesc")}
      >
        <p className="text-sm text-secondary">
          {t("settings.securityBody")}
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </Section>

      <Section
        icon={Building2}
        title={t("settings.about")}
        description={`${COMPANY.productName} by ${COMPANY.legalName}`}
      >
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("settings.product")}</dt>
            <dd className="font-medium text-foreground">{COMPANY.productName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("settings.company")}</dt>
            <dd className="font-medium text-foreground">{COMPANY.legalName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("settings.version")}</dt>
            <dd className="font-medium text-foreground">{COMPANY.version}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("settings.support")}</dt>
            <dd>
              <a
                href={`mailto:${COMPANY.supportEmail}`}
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                {COMPANY.supportEmail}
              </a>
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          © {new Date().getFullYear()} {COMPANY.legalName}. {COMPANY.tagline}{" "}
          Not a bank, lender, or investment platform.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button href="/privacy" variant="secondary" size="sm">
            {t("settings.linkPrivacy")}
          </Button>
          <Button href="/support" variant="secondary" size="sm">
            {t("settings.support")}
          </Button>
          <Button href="/terms" variant="secondary" size="sm">
            {t("settings.linkTerms")}
          </Button>
        </div>
      </Section>

      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      {msg ? <p className="text-sm text-primary">{msg}</p> : null}
    </div>
  );
}
