"use client";

import {
  AVATAR_PRESETS,
  AVATAR_STATUSES,
  getAvatarPreset,
} from "@/lib/avatar/presets";
import { useT } from "@/components/i18n/LocaleProvider";
import { Avatar } from "@/components/ui/Avatar";
import type { AvatarPresence, AvatarStatusSource } from "@/lib/avatar/contextual-status";
import {
  avatarStatusMessageKey,
  avatarStatusSourceKey,
} from "@/lib/avatar/status-label";

type SaveState = "idle" | "saving" | "saved" | "error";

type AvatarPickerProps = {
  presetId: string | null;
  status: string | null;
  resolvedStatus?: string | null;
  presence?: AvatarPresence | null;
  statusSource?: AvatarStatusSource | null;
  statusLive?: boolean;
  autoEnabled?: boolean;
  displayName: string;
  disabled?: boolean;
  saveState?: SaveState;
  saveError?: string | null;
  onPresetChange: (id: string | null) => void;
  onStatusChange: (status: string | null) => void;
  onAutoChange?: (auto: boolean) => void;
};

export function AvatarPicker({
  presetId,
  status,
  resolvedStatus,
  presence = "idle",
  statusSource = "none",
  statusLive = false,
  autoEnabled = true,
  displayName,
  disabled,
  saveState = "idle",
  saveError = null,
  onPresetChange,
  onStatusChange,
  onAutoChange,
}: AvatarPickerProps) {
  const { t } = useT();
  const preset = getAvatarPreset(presetId);
  const selectedLabel = preset ? preset.label : t("avatar.initialsOption");
  const busy = Boolean(disabled) || saveState === "saving";
  const shownStatus = resolvedStatus || status;
  const statusKey = avatarStatusMessageKey(shownStatus);
  const sourceKey = avatarStatusSourceKey(statusSource);
  const statusLabel = statusKey ? t(statusKey) : t("avatar.statusNone");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar
          name={displayName}
          size="2xl"
          presetId={presetId}
          status={shownStatus || undefined}
          presence={presence}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {t("avatar.preview")}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
            {selectedLabel}
          </p>
          <p className="mt-0.5 truncate text-sm text-secondary">
            {statusLabel}
            {statusLive ? ` · ${t("avatar.liveNow")}` : sourceKey ? ` · ${t(sourceKey)}` : ""}
          </p>
          <p
            className="mt-2 text-xs font-medium"
            aria-live="polite"
            role={saveState === "error" ? "alert" : undefined}
          >
            {saveState === "saving" ? (
              <span className="text-muted">{t("avatar.saving")}</span>
            ) : saveState === "saved" ? (
              <span className="text-success">{t("avatar.saved")}</span>
            ) : saveState === "error" ? (
              <span className="text-error">{saveError || t("errors.saveFailed")}</span>
            ) : (
              <span className="text-primary">{t("avatar.selected")}</span>
            )}
          </p>
        </div>
      </div>

      <div>
        <p id="avatar-grid-label" className="mb-2 text-sm font-medium text-foreground">
          {t("avatar.choose")}
        </p>
        <p className="mb-3 text-xs text-muted">{t("avatar.hint")}</p>
        <div
          role="radiogroup"
          aria-labelledby="avatar-grid-label"
          aria-disabled={busy || undefined}
          className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-2.5"
        >
          <button
            type="button"
            role="radio"
            aria-checked={!presetId}
            aria-label={t("avatar.initialsOption")}
            disabled={busy}
            onClick={() => onPresetChange(null)}
            className={`avatar-option min-h-[4.5rem] ${!presetId ? "avatar-option-selected" : ""}`}
          >
            <Avatar name={displayName} size="md" presetId={null} />
            <span className="max-w-full truncate text-[0.65rem] font-medium text-secondary">
              {t("avatar.initialsOption")}
            </span>
          </button>
          {AVATAR_PRESETS.map((p) => {
            const selected = presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={p.label}
                disabled={busy}
                onClick={() => onPresetChange(p.id)}
                className={`avatar-option min-h-[4.5rem] ${selected ? "avatar-option-selected" : ""}`}
              >
                <Avatar name={p.label} size="md" presetId={p.id} />
                <span className="max-w-full truncate text-[0.65rem] font-medium text-secondary">
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {onAutoChange ? (
          <label className="mb-4 flex cursor-pointer items-start justify-between gap-4">
            <span>
              <span className="block text-sm font-medium text-foreground">
                {t("avatar.auto")}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {t("avatar.autoHint")}
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={autoEnabled}
              disabled={busy}
              onClick={() => onAutoChange(!autoEnabled)}
              className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                autoEnabled ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 start-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  autoEnabled ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        ) : null}

        <p id="avatar-status-label" className="mb-2 text-sm font-medium text-foreground">
          {t("avatar.status")}
        </p>
        <div
          role="radiogroup"
          aria-labelledby="avatar-status-label"
          aria-disabled={busy || undefined}
          className="flex flex-wrap gap-1.5"
        >
          <button
            type="button"
            role="radio"
            aria-checked={!status}
            disabled={busy}
            onClick={() => onStatusChange(null)}
            className={`avatar-status-chip ${!status ? "avatar-status-chip-selected" : ""}`}
          >
            {t("avatar.statusNone")}
          </button>
          {AVATAR_STATUSES.map((s) => {
            const selected = status === s || avatarStatusMessageKey(status) === avatarStatusMessageKey(s);
            const key = avatarStatusMessageKey(s);
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={busy}
                onClick={() => onStatusChange(s)}
                className={`avatar-status-chip ${selected ? "avatar-status-chip-selected" : ""}`}
              >
                {key ? t(key) : s}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">{t("avatar.statusHint")}</p>
      </div>
    </div>
  );
}
