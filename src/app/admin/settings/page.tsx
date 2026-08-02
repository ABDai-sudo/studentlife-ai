"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/admin/ui";

type Settings = {
  analyticsRetentionDays: number;
  auditRetentionDays: number;
  errorRetentionDays: number;
  analyticsOptOutDefault: boolean;
  mfaStatus: string;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const json = await res.json();
      setSettings(json.data.settings);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!settings) return;
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analyticsRetentionDays: settings.analyticsRetentionDays,
        auditRetentionDays: settings.auditRetentionDays,
        errorRetentionDays: settings.errorRetentionDays,
        analyticsOptOutDefault: settings.analyticsOptOutDefault,
      }),
    });
    setMsg(res.ok ? "Saved" : "Save failed");
  }

  if (!settings) {
    return (
      <EmptyState
        title="Settings"
        body="Loading retention and privacy preferences…"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Retention and privacy controls. No compliance certifications claimed.
        </p>
      </div>
      <div className="card-surface space-y-4 p-5">
        <Field
          label="Analytics retention (days)"
          value={settings.analyticsRetentionDays}
          onChange={(v) =>
            setSettings({ ...settings, analyticsRetentionDays: v })
          }
        />
        <Field
          label="Audit log retention (days)"
          value={settings.auditRetentionDays}
          onChange={(v) => setSettings({ ...settings, auditRetentionDays: v })}
        />
        <Field
          label="Error log retention (days)"
          value={settings.errorRetentionDays}
          onChange={(v) => setSettings({ ...settings, errorRetentionDays: v })}
        />
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={settings.analyticsOptOutDefault}
            onChange={(e) =>
              setSettings({
                ...settings,
                analyticsOptOutDefault: e.target.checked,
              })
            }
          />
          Default analytics opt-out for new visitors
        </label>
        <p className="text-sm text-muted">MFA status: {settings.mfaStatus}</p>
        <button
          type="button"
          onClick={() => void save()}
          className="min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-white"
        >
          Save settings
        </button>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 min-h-11 w-full max-w-xs rounded-lg border border-border px-3"
      />
    </label>
  );
}
