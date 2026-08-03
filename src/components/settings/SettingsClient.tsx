"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Bell,
  Building2,
  Globe2,
  Lock,
  Mail,
  Shield,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { LogoutButton } from "@/components/app/LogoutButton";
import { COMPANY } from "@/lib/company";

type Profile = {
  currency: string;
  country: string;
  timezone: string;
  studentType: string;
  monthlyPocketMoney: number | null;
};

type Prefs = {
  weeklyDigest: boolean;
  expenseReminders: boolean;
  goalAlerts: boolean;
  productUpdates: boolean;
  shareAnonymousAnalytics: boolean;
};

const DEFAULT_PREFS: Prefs = {
  weeklyDigest: true,
  expenseReminders: true,
  goalAlerts: true,
  productUpdates: false,
  shareAnonymousAnalytics: true,
};

const PREFS_KEY = "sl_settings_prefs_v1";

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
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
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
  children: React.ReactNode;
}) {
  return (
    <section className="card-surface overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-secondary text-secondary">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="mt-0.5 text-xs text-muted">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function SettingsClient({
  email,
  name,
  plan,
}: {
  email: string;
  name: string | null;
  plan: string;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currency, setCurrency] = useState("INR");
  const [country, setCountry] = useState("IN");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      // ignore
    }

    const res = await fetch("/api/profile", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not load settings.");
      return;
    }
    const p = json.data.profile as Profile | null;
    if (p) {
      setProfile(p);
      setCurrency(p.currency || "INR");
      setCountry(p.country || "IN");
      setTimezone(p.timezone || "Asia/Kolkata");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function savePrefs(next: Prefs) {
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
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
        setError(json?.error?.message || "Could not save preferences.");
        return;
      }
      setProfile(json.data.profile);
      setMsg("Preferences saved.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Section
        icon={UserRound}
        title="Account"
        description="Signed-in identity for this workspace"
      >
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <dt className="text-muted">Name</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {name ?? "Not set"}
              </dd>
            </div>
            <span className="rounded-md border border-border bg-surface-secondary px-2 py-1 text-xs font-medium text-secondary">
              {plan} plan
            </span>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="mt-0.5 font-medium text-foreground">{email}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button href="/dashboard/profile" variant="secondary" size="sm">
            Edit profile & pocket money
          </Button>
        </div>
      </Section>

      <Section
        icon={Globe2}
        title="Region & currency"
        description="Controls how money amounts are shown"
      >
        <form onSubmit={onSaveRegion} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="currency" label="Currency">
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
            <FormField id="country" label="Country">
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
          <FormField id="timezone" label="Timezone">
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
              Pocket money is not set yet.{" "}
              <Link href="/dashboard/profile" className="text-primary underline">
                Add it in Profile
              </Link>
              .
            </p>
          ) : null}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : "Save region"}
          </Button>
        </form>
      </Section>

      <Section
        icon={Bell}
        title="Notifications"
        description="Choose what we remind you about on this device"
      >
        <div className="divide-y divide-border">
          <Toggle
            checked={prefs.expenseReminders}
            onChange={(v) => savePrefs({ ...prefs, expenseReminders: v })}
            label="Expense reminders"
            description="Nudge when you have not logged spending for a while"
          />
          <Toggle
            checked={prefs.weeklyDigest}
            onChange={(v) => savePrefs({ ...prefs, weeklyDigest: v })}
            label="Weekly money summary"
            description="A short review of spend vs safe daily budget"
          />
          <Toggle
            checked={prefs.goalAlerts}
            onChange={(v) => savePrefs({ ...prefs, goalAlerts: v })}
            label="Savings goal alerts"
            description="Updates when you reach milestones"
          />
          <Toggle
            checked={prefs.productUpdates}
            onChange={(v) => savePrefs({ ...prefs, productUpdates: v })}
            label="Product updates"
            description="Occasional notes about new StudentLife features"
          />
        </div>
      </Section>

      <Section
        icon={Shield}
        title="Privacy"
        description="How usage data helps improve the product"
      >
        <div className="divide-y divide-border">
          <Toggle
            checked={prefs.shareAnonymousAnalytics}
            onChange={(v) =>
              savePrefs({ ...prefs, shareAnonymousAnalytics: v })
            }
            label="Anonymous product analytics"
            description="Helps us fix bugs and improve money tools. No bank access."
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          We do not sell personal data. Budgeting guidance only — not banking or
          credit advice.
        </p>
      </Section>

      <Section
        icon={Lock}
        title="Security"
        description="Session controls for this browser"
      >
        <p className="text-sm text-secondary">
          You are signed in on this device. Sign out when using a shared computer.
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </Section>

      <Section
        icon={Building2}
        title="About"
        description={`${COMPANY.productName} by ${COMPANY.legalName}`}
      >
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Product</dt>
            <dd className="font-medium text-foreground">{COMPANY.productName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Company</dt>
            <dd className="font-medium text-foreground">{COMPANY.legalName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Version</dt>
            <dd className="font-medium text-foreground">{COMPANY.version}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Support</dt>
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
