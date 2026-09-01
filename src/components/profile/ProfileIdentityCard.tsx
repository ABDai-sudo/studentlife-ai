"use client";

import Link from "next/link";
import { Flame, Target, TrendingUp } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { AvatarPicker } from "@/components/avatar/AvatarPicker";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useT } from "@/components/i18n/LocaleProvider";
import {
  displayAvatarStatus,
  frameToUiRing,
  getAvatarPreset,
  type AvatarFrameId,
} from "@/lib/avatar/presets";
import { xpProgressFromTotal } from "@/lib/gamification/xp-progress";

export type IdentityStats = {
  displayName: string | null;
  avatarPresetId: string | null;
  avatarStatus: string | null;
  xpTotal: number;
  level: number;
  academicAura: number;
  streakCurrent: number;
  cosmeticFrame: AvatarFrameId;
  leaderboardOptIn: boolean;
  studyGoal?: string | null;
};

export function ProfileIdentityCard({
  userName,
  identity,
  saving,
  saveState = "idle",
  saveError = null,
  onPresetChange,
  onStatusChange,
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
  onStatusChange: (status: string | null) => void;
  displayNameDraft: string;
  onDisplayNameChange: (v: string) => void;
  onDisplayNameBlur: () => void;
}) {
  const { t } = useT();
  const name = identity.displayName?.trim() || userName;
  const frame = frameToUiRing(identity.cosmeticFrame);
  const preset = getAvatarPreset(identity.avatarPresetId);
  const xp = xpProgressFromTotal(identity.xpTotal);
  const studyNote = identity.studyGoal?.trim() || "";

  const badges: string[] = [];
  if (identity.streakCurrent >= 7) badges.push("7-day streak");
  if (identity.streakCurrent >= 30) badges.push("30-day streak");
  if (identity.streakCurrent >= 100) badges.push("100-day streak");
  if (identity.xpTotal >= 1000) badges.push("1,000 XP");
  if (identity.academicAura >= 80) badges.push("Aura 80+");
  if (identity.cosmeticFrame === "achievement") badges.push("Achievement");

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar
            name={name}
            size="2xl"
            presetId={identity.avatarPresetId}
            frame={frame}
            aura={identity.academicAura}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {t("profile.heroLabel")}
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {name}
            </h2>
            <p className="mt-1.5 text-sm text-secondary">
              {preset ? preset.label : t("avatar.initialsOption")}
              {identity.avatarStatus
                ? ` · ${displayAvatarStatus(identity.avatarStatus)}`
                : ""}
            </p>
            {studyNote ? (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-secondary">
                {studyNote}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-border pt-5">
          <div>
            <p className="flex items-center gap-1 text-xs font-medium text-muted">
              <TrendingUp className="h-3 w-3 shrink-0 text-primary" aria-hidden />
              {t("dashboard.xp")}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {t("dashboard.level", { level: identity.level })}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs font-medium text-muted">
              <Flame className="h-3 w-3 shrink-0 text-warning" aria-hidden />
              {t("dashboard.currentStreak")}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {t("dashboard.days", { count: identity.streakCurrent })}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs font-medium text-muted">
              <Target className="h-3 w-3 shrink-0 text-primary" aria-hidden />
              {t("dashboard.academicAura")}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {identity.academicAura}/100
            </p>
          </div>
        </div>

        <ProgressBar
          value={xp.levelProgress}
          tone="primary"
          label={
            xp.xpToNext > 0
              ? `${xp.levelName} · ${t("dashboard.xpToNext", { xp: xp.xpToNext })}`
              : `${xp.levelName} · ${t("dashboard.maxLevel")}`
          }
        />

        {badges.length ? (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center rounded-md border border-border bg-surface-secondary px-2 py-0.5 text-[0.7rem] font-medium text-secondary"
              >
                {b}
              </span>
            ))}
          </div>
        ) : null}

        <p className="text-xs text-muted">
          {identity.leaderboardOptIn
            ? t("leaderboard.optIn")
            : t("leaderboard.hiddenTitle")}{" "}
          <Link href="/settings#leaderboard" className="text-primary underline">
            {t("leaderboard.openSettings")}
          </Link>
        </p>

        <div className="border-t border-border pt-5">
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
        </div>

        <AvatarPicker
          presetId={identity.avatarPresetId}
          status={identity.avatarStatus}
          displayName={name}
          disabled={saving}
          saveState={saveState}
          saveError={saveError}
          onPresetChange={onPresetChange}
          onStatusChange={onStatusChange}
        />

        <Button href="/dashboard/leaderboard" size="sm" variant="secondary">
          {t("nav.leaderboard")}
        </Button>
    </section>
  );
}
