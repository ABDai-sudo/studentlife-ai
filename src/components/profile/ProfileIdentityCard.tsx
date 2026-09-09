"use client";

import Link from "next/link";
import { useState } from "react";
import { Flame, Pencil, Settings2, Sparkles, Target, TrendingUp } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { AvatarStudio, StatusChipPicker } from "@/components/avatar/AvatarStudio";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useT } from "@/components/i18n/LocaleProvider";
import {
  displayAvatarStatus,
  frameToUiRing,
  type AvatarFrameId,
} from "@/lib/avatar/presets";
import { userAvatarPhotoSrc } from "@/lib/avatar/selfie";
import { avatarStatusMessageKey } from "@/lib/avatar/status-label";
import type {
  AvatarPresence,
  AvatarStatusSource,
} from "@/lib/avatar/contextual-status";
import { xpProgressFromTotal } from "@/lib/gamification/xp-progress";

export type IdentityStats = {
  displayName: string | null;
  avatarPresetId: string | null;
  avatarImageUrl?: string | null;
  avatarStatus: string | null;
  resolvedAvatarStatus?: string | null;
  avatarPresence?: AvatarPresence | null;
  avatarStatusSource?: AvatarStatusSource | null;
  avatarStatusLive?: boolean;
  avatarStatusAuto?: boolean;
  xpTotal: number;
  level: number;
  academicAura: number;
  streakCurrent: number;
  cosmeticFrame: AvatarFrameId;
  leaderboardOptIn: boolean;
  studyGoal?: string | null;
  institutionName?: string | null;
  achievementCodes?: string[];
};

function handleFromName(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18);
  return slug ? `@${slug}` : "@student";
}

export function ProfileIdentityCard({
  userName,
  identity,
  saving,
  saveState = "idle",
  saveError = null,
  onPresetChange,
  onSelfieChange,
  onStatusChange,
  onAutoChange,
  onAvatarCommit,
  onDisplayNameBlur,
  displayNameDraft,
  onDisplayNameChange,
}: {
  userName: string;
  identity: IdentityStats;
  saving?: boolean;
  saveState?: "idle" | "saving" | "saved" | "error";
  saveError?: string | null;
  onPresetChange: (id: string | null) => void;
  onSelfieChange?: (url: string | null) => void;
  onStatusChange: (status: string | null) => void;
  onAutoChange?: (auto: boolean) => void;
  onAvatarCommit?: (draft: {
    presetId: string | null;
    imageSrc: string | null;
    status: string | null;
    autoEnabled: boolean;
  }) => void;
  displayNameDraft: string;
  onDisplayNameChange: (v: string) => void;
  onDisplayNameBlur: () => void;
}) {
  const { t } = useT();
  const [studioOpen, setStudioOpen] = useState(false);
  const name = identity.displayName?.trim() || userName;
  const frame = frameToUiRing(identity.cosmeticFrame);
  const xp = xpProgressFromTotal(identity.xpTotal);
  const shownStatus = identity.resolvedAvatarStatus || identity.avatarStatus;
  const shownStatusKey = avatarStatusMessageKey(shownStatus);
  const handle = handleFromName(name);
  const institution = identity.institutionName?.trim() || "";
  const achievements = identity.achievementCodes ?? [];
  const photoSrc = userAvatarPhotoSrc(identity.avatarImageUrl);

  return (
    <section className="profile-experience space-y-6">
      <div className="profile-hero">
        <div className="profile-hero-glow" aria-hidden />
        <div className="profile-hero-inner">
          <div className="profile-hero-avatar">
            <Avatar
              name={name}
              size="hero"
              shape={photoSrc ? "figure" : "circle"}
              presetId={identity.avatarPresetId}
              imageSrc={photoSrc}
              frame={frame}
              aura={identity.academicAura}
              presence={identity.avatarPresence}
            />
          </div>

          <div className="profile-hero-meta">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
              {t("profile.heroLabel")}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {name}
            </h2>
            <p className="mt-1 text-sm font-medium text-white/75">{handle}</p>
            {institution ? (
              <p className="mt-2 text-sm text-white/80">{institution}</p>
            ) : null}

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
              <span
                className="profile-status-dot profile-status-dot-on-dark"
                data-status={shownStatus || "none"}
                aria-hidden
              />
              <span>
                {shownStatus
                  ? shownStatusKey
                    ? t(shownStatusKey)
                    : displayAvatarStatus(shownStatus)
                  : t("avatar.statusNone")}
              </span>
              {identity.avatarStatusLive ? (
                <span className="text-xs text-white/70">· {t("avatar.liveNow")}</span>
              ) : null}
            </div>

            <div className="profile-hero-stats">
              <div className="profile-stat-card">
                <p className="profile-stat-label">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  {t("dashboard.level", { level: identity.level })}
                </p>
                <p className="profile-stat-value">{identity.xpTotal} XP</p>
              </div>
              <div className="profile-stat-card">
                <p className="profile-stat-label">
                  <Flame className="h-3.5 w-3.5" aria-hidden />
                  {t("dashboard.currentStreak")}
                </p>
                <p className="profile-stat-value">
                  {t("dashboard.days", { count: identity.streakCurrent })}
                </p>
              </div>
              <div className="profile-stat-card">
                <p className="profile-stat-label">
                  <Target className="h-3.5 w-3.5" aria-hidden />
                  {t("dashboard.academicAura")}
                </p>
                <p className="profile-stat-value">{identity.academicAura}/100</p>
              </div>
            </div>

            <div className="mt-4 max-w-md">
              <ProgressBar
                value={xp.levelProgress}
                tone="primary"
                label={
                  xp.xpToNext > 0
                    ? `${xp.levelName} · ${t("dashboard.xpToNext", { xp: xp.xpToNext })}`
                    : `${xp.levelName} · ${t("dashboard.maxLevel")}`
                }
              />
            </div>

            <button
              type="button"
              onClick={() => setStudioOpen(true)}
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-white/90"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              {t("avatar.editAvatar")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="profile-section lg:col-span-1">
          <h3 className="profile-section-title">{t("profile.section.identity")}</h3>
          <label
            htmlFor="profileDisplayName"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t("leaderboard.displayName")}
          </label>
          <input
            id="profileDisplayName"
            className="field-input"
            maxLength={80}
            disabled={saving}
            value={displayNameDraft}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            onBlur={onDisplayNameBlur}
          />
          {institution ? (
            <p className="mt-3 text-sm text-secondary">
              <span className="font-medium text-foreground">{t("profile.institution")}: </span>
              {institution}
            </p>
          ) : null}
          <div className="mt-4">
            <StatusChipPicker
              status={identity.avatarStatus}
              busy={saving}
              onStatusChange={onStatusChange}
            />
          </div>
          {onAutoChange ? (
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
              <span className="text-sm text-foreground">{t("avatar.auto")}</span>
              <button
                type="button"
                role="switch"
                aria-checked={identity.avatarStatusAuto !== false}
                disabled={saving}
                onClick={() => onAutoChange(!(identity.avatarStatusAuto !== false))}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                  identity.avatarStatusAuto !== false ? "bg-primary" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 start-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    identity.avatarStatusAuto !== false
                      ? "translate-x-5 rtl:-translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          ) : null}
        </section>

        <section className="profile-section lg:col-span-1">
          <h3 className="profile-section-title">{t("profile.section.progress")}</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span className="text-secondary">{t("dashboard.level", { level: identity.level })}</span>
              <span className="font-semibold text-foreground">{identity.xpTotal} XP</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-secondary">{t("dashboard.currentStreak")}</span>
              <span className="font-semibold text-foreground">
                {t("dashboard.days", { count: identity.streakCurrent })}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-secondary">{t("dashboard.academicAura")}</span>
              <span className="font-semibold text-foreground">{identity.academicAura}/100</span>
            </li>
          </ul>
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              {t("profile.achievements")}
            </p>
            {achievements.length ? (
              <div className="flex flex-wrap gap-1.5">
                {achievements.slice(0, 8).map((code) => (
                  <span
                    key={code}
                    className="rounded-lg border border-border bg-surface-secondary px-2 py-1 text-[0.7rem] font-medium text-secondary"
                  >
                    {code.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">{t("profile.achievementsEmpty")}</p>
            )}
          </div>
        </section>

        <section className="profile-section lg:col-span-1">
          <h3 className="profile-section-title">{t("profile.section.campus")}</h3>
          <p className="text-sm text-secondary">
            {identity.leaderboardOptIn
              ? t("leaderboard.optIn")
              : t("leaderboard.hiddenTitle")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/settings#leaderboard"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-foreground transition hover:bg-surface-secondary"
            >
              <Settings2 className="h-4 w-4" aria-hidden />
              {t("leaderboard.openSettings")}
            </Link>
            <Link
              href="/dashboard/campus-circle"
              className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-sm font-semibold text-foreground transition hover:bg-surface-secondary"
            >
              {t("nav.campusCircle")}
            </Link>
            <Link
              href="/dashboard/leaderboard"
              className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-sm font-semibold text-foreground transition hover:bg-surface-secondary"
            >
              {t("nav.leaderboard")}
            </Link>
          </div>
          {identity.studyGoal?.trim() ? (
            <p className="mt-4 text-sm text-secondary">
              <span className="font-medium text-foreground">{t("profile.studyGoal")}: </span>
              {identity.studyGoal}
            </p>
          ) : null}
        </section>
      </div>

      {studioOpen && (onSelfieChange || onAvatarCommit) ? (
        <AvatarStudio
          open={studioOpen}
          onClose={() => setStudioOpen(false)}
          displayName={name}
          presetId={identity.avatarPresetId}
          imageSrc={identity.avatarImageUrl}
          status={identity.avatarStatus}
          resolvedStatus={identity.resolvedAvatarStatus}
          presence={identity.avatarPresence}
          statusSource={identity.avatarStatusSource}
          statusLive={identity.avatarStatusLive}
          autoEnabled={identity.avatarStatusAuto !== false}
          cosmeticFrame={identity.cosmeticFrame}
          disabled={saving}
          saveState={saveState}
          saveError={saveError}
          onSave={(draft) => {
            if (onAvatarCommit) {
              onAvatarCommit(draft);
              return;
            }
            if (draft.imageSrc !== (identity.avatarImageUrl ?? null) && onSelfieChange) {
              onSelfieChange(draft.imageSrc);
            }
            if (draft.presetId !== (identity.avatarPresetId ?? null)) {
              onPresetChange(draft.presetId);
            }
            if (draft.status !== (identity.avatarStatus ?? null)) {
              onStatusChange(draft.status);
            }
            if (
              onAutoChange &&
              draft.autoEnabled !== (identity.avatarStatusAuto !== false)
            ) {
              onAutoChange(draft.autoEnabled);
            }
          }}
        />
      ) : null}
    </section>
  );
}
