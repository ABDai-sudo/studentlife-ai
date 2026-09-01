"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, Trophy, UserRound } from "lucide-react";
import { AvatarPicker } from "@/components/avatar/AvatarPicker";
import { FormField } from "@/components/ui/FormField";
import { useT } from "@/components/i18n/LocaleProvider";
import { mountFetch } from "@/lib/react/mount-fetch";
import { broadcastIdentityChange } from "@/lib/avatar/identity-events";

type NotifPrefs = {
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
};

type SocialState = {
  displayName: string;
  leaderboardOptIn: boolean;
  leaderboardShowAvatar: boolean;
  avatarPresetId: string | null;
  avatarStatus: string | null;
};

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
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
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
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
  id,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border pt-8">
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

export function EngagementSettings({
  initialSocial,
  initialPrefs = null,
  onMessage,
  onError,
}: {
  initialSocial: SocialState;
  initialPrefs?: NotifPrefs | null;
  onMessage: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const { t } = useT();
  const [social, setSocial] = useState(initialSocial);
  const lastSavedDisplayName = useRef(initialSocial.displayName);
  const [prefs, setPrefs] = useState<NotifPrefs | null>(initialPrefs);
  const [saving, setSaving] = useState(false);

  const [prefsError, setPrefsError] = useState<string | null>(null);

  useEffect(() => {
    // Soft-refresh from Neon; SSR initialPrefs avoids permanent Loading.
    return mountFetch("/api/notifications", ({ ok, json }) => {
      const body = json as {
        success?: boolean;
        error?: { message?: string };
        data?: { preferences?: NotifPrefs };
      } | null;
      if (!ok || !body?.success || !body.data?.preferences) {
        if (!initialPrefs) {
          setPrefsError(body?.error?.message || "Could not load notifications.");
        }
        return;
      }
      const p = body.data.preferences;
      setPrefs({
        pauseAll: Boolean(p.pauseAll),
        streakAtRisk: p.streakAtRisk !== false,
        streakFinalReminder: Boolean(p.streakFinalReminder),
        dailyQuests: p.dailyQuests !== false,
        assignmentDeadline: p.assignmentDeadline !== false,
        upcomingExam: p.upcomingExam !== false,
        overspending: p.overspending !== false,
        savingsGoal: p.savingsGoal !== false,
        weeklyRecap: p.weeklyRecap !== false,
        lowMoney: p.lowMoney !== false,
      });
      setPrefsError(null);
    }, () => {
      if (!initialPrefs) {
        setPrefsError("Network error while loading notifications.");
      }
    });
  }, [initialPrefs]);

  async function patchNotifs(partial: Partial<NotifPrefs>) {
    if (!prefs) return;
    const next = { ...prefs, ...partial };
    setPrefs(next);
    setSaving(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setPrefs(prefs);
        onError(json?.error?.message || t("errors.generic"));
        return;
      }
      onMessage(t("toast.saved"));
    } catch {
      setPrefs(prefs);
      onError(t("errors.network"));
    } finally {
      setSaving(false);
    }
  }

  async function patchProfile(partial: Partial<SocialState>) {
    const prev = social;
    const next = { ...social, ...partial };
    setSocial(next);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setSocial(prev);
        onError(json?.error?.message || t("errors.generic"));
        return;
      }
      const p = json.data?.profile;
      if (p) {
        const nextSocial = {
          displayName: p.displayName ?? "",
          leaderboardOptIn: Boolean(p.leaderboardOptIn),
          leaderboardShowAvatar: p.leaderboardShowAvatar !== false,
          avatarPresetId: p.avatarPresetId ?? null,
          avatarStatus: p.avatarStatus ?? null,
        };
        setSocial(nextSocial);
        lastSavedDisplayName.current = nextSocial.displayName;
        broadcastIdentityChange({
          avatarPresetId: nextSocial.avatarPresetId,
          avatarStatus: nextSocial.avatarStatus,
          displayName: nextSocial.displayName,
        });
      }
      onMessage(t("toast.saved"));
    } catch {
      setSocial(prev);
      onError(t("errors.network"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Section
        icon={UserRound}
        title={t("avatar.title")}
        description={t("avatar.hint")}
      >
        <AvatarPicker
          presetId={social.avatarPresetId}
          status={social.avatarStatus}
          displayName={social.displayName || "Student"}
          disabled={saving}
          saveState={saving ? "saving" : "idle"}
          onPresetChange={(id) => patchProfile({ avatarPresetId: id })}
          onStatusChange={(status) => patchProfile({ avatarStatus: status })}
        />
      </Section>

      <Section
        id="leaderboard"
        icon={Trophy}
        title={t("leaderboard.title")}
        description={t("leaderboard.optInHint")}
      >
        <div className="divide-y divide-border">
          <Toggle
            checked={social.leaderboardOptIn}
            disabled={saving}
            onChange={(v) => patchProfile({ leaderboardOptIn: v })}
            label={t("leaderboard.optIn")}
            description={t("leaderboard.optInHint")}
          />
          <Toggle
            checked={social.leaderboardShowAvatar}
            disabled={saving || !social.leaderboardOptIn}
            onChange={(v) => patchProfile({ leaderboardShowAvatar: v })}
            label={t("leaderboard.showAvatar")}
            description={t("leaderboard.privacyNote")}
          />
        </div>
        <div className="mt-3">
          <FormField
            id="leaderboardDisplayName"
            label={t("leaderboard.displayName")}
          >
            <input
              id="leaderboardDisplayName"
              className="field-input"
              maxLength={80}
              disabled={saving}
              value={social.displayName}
              onChange={(e) =>
                setSocial((s) => ({ ...s, displayName: e.target.value }))
              }
              onBlur={() => {
                if (social.displayName !== lastSavedDisplayName.current) {
                  void patchProfile({ displayName: social.displayName });
                }
              }}
              placeholder="Student"
            />
          </FormField>
        </div>
      </Section>

      <Section
        icon={Bell}
        title={t("settings.notifications")}
        description={t("settings.notificationsDesc")}
      >
        {prefsError ? (
          <p className="text-sm text-error" role="alert">
            {prefsError}
          </p>
        ) : !prefs ? (
          <p className="text-sm text-muted">{t("loading.generic")}</p>
        ) : (
          <div className="divide-y divide-border">
            <Toggle
              checked={prefs.streakAtRisk}
              disabled={saving}
              onChange={(v) => patchNotifs({ streakAtRisk: v })}
              label={t("settings.notifStreak")}
              description={t("settings.notifStreakDesc")}
            />
            <Toggle
              checked={prefs.dailyQuests}
              disabled={saving}
              onChange={(v) => patchNotifs({ dailyQuests: v })}
              label={t("settings.notifQuests")}
              description={t("settings.notifQuestsDesc")}
            />
            <Toggle
              checked={prefs.assignmentDeadline}
              disabled={saving}
              onChange={(v) => patchNotifs({ assignmentDeadline: v })}
              label={t("settings.notifAssignments")}
              description={t("settings.notifAssignmentsDesc")}
            />
            <Toggle
              checked={prefs.upcomingExam}
              disabled={saving}
              onChange={(v) => patchNotifs({ upcomingExam: v })}
              label={t("settings.notifExams")}
              description={t("settings.notifExamsDesc")}
            />
            <Toggle
              checked={prefs.overspending}
              disabled={saving}
              onChange={(v) => patchNotifs({ overspending: v })}
              label={t("settings.notifOverspend")}
              description={t("settings.notifOverspendDesc")}
            />
            <Toggle
              checked={prefs.savingsGoal}
              disabled={saving}
              onChange={(v) => patchNotifs({ savingsGoal: v })}
              label={t("settings.notifSavings")}
              description={t("settings.notifSavingsDesc")}
            />
            <Toggle
              checked={prefs.weeklyRecap}
              disabled={saving}
              onChange={(v) => patchNotifs({ weeklyRecap: v })}
              label={t("settings.notifWeekly")}
              description={t("settings.notifWeeklyDesc")}
            />
            <Toggle
              checked={prefs.lowMoney}
              disabled={saving}
              onChange={(v) => patchNotifs({ lowMoney: v })}
              label={t("settings.notifExpense")}
              description={t("settings.notifExpenseDesc")}
            />
          </div>
        )}
      </Section>
    </>
  );
}
