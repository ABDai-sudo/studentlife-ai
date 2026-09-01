"use client";

import {
  AVATAR_PRESETS,
  AVATAR_STATUSES,
  displayAvatarStatus,
  getAvatarPreset,
} from "@/lib/avatar/presets";
import { useT } from "@/components/i18n/LocaleProvider";
import { Avatar } from "@/components/ui/Avatar";

type SaveState = "idle" | "saving" | "saved" | "error";

type AvatarPickerProps = {
  presetId: string | null;
  status: string | null;
  displayName: string;
  disabled?: boolean;
  saveState?: SaveState;
  saveError?: string | null;
  onPresetChange: (id: string | null) => void;
  onStatusChange: (status: string | null) => void;
};

export function AvatarPicker({
  presetId,
  status,
  displayName,
  disabled,
  saveState = "idle",
  saveError = null,
  onPresetChange,
  onStatusChange,
}: AvatarPickerProps) {
  const { t } = useT();
  const preset = getAvatarPreset(presetId);
  const selectedLabel = preset ? preset.label : t("avatar.initialsOption");
  const busy = Boolean(disabled) || saveState === "saving";
  const statusLabel = displayAvatarStatus(status);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar
          name={displayName}
          size="2xl"
          presetId={presetId}
          status={status || undefined}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {t("avatar.preview")}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
            {selectedLabel}
          </p>
          <p className="mt-0.5 truncate text-sm text-secondary">
            {statusLabel || t("avatar.statusNone")}
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
            const selected = statusLabel === s;
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
                {s}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">{t("avatar.statusHint")}</p>
      </div>
    </div>
  );
}
