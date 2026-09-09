"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { SelfieAvatarControls } from "@/components/avatar/SelfieAvatarControls";
import { useT } from "@/components/i18n/LocaleProvider";
import {
  AVATAR_STATUSES,
  frameToUiRing,
  type AvatarFrameId,
} from "@/lib/avatar/presets";
import { userAvatarPhotoSrc } from "@/lib/avatar/selfie";
import type { AvatarPresence, AvatarStatusSource } from "@/lib/avatar/contextual-status";
import {
  avatarStatusMessageKey,
  avatarStatusSourceKey,
} from "@/lib/avatar/status-label";

/**
 * Current-release Avatar Studio: preview + Create Your Look (selfie/upload).
 * Future customization categories (face/hair/outfit/etc.) stay out of the UI
 * until that phase ships — architecture elsewhere is intentionally left intact.
 */
export function AvatarStudio({
  open,
  onClose,
  displayName,
  presetId,
  imageSrc,
  status,
  resolvedStatus,
  presence,
  statusSource,
  statusLive,
  autoEnabled,
  cosmeticFrame,
  disabled,
  saveState,
  saveError,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  displayName: string;
  presetId: string | null;
  imageSrc?: string | null;
  status: string | null;
  resolvedStatus?: string | null;
  presence?: AvatarPresence | null;
  statusSource?: AvatarStatusSource | null;
  statusLive?: boolean;
  autoEnabled?: boolean;
  cosmeticFrame: AvatarFrameId;
  disabled?: boolean;
  saveState?: "idle" | "saving" | "saved" | "error";
  saveError?: string | null;
  onSave: (draft: {
    presetId: string | null;
    imageSrc: string | null;
    status: string | null;
    autoEnabled: boolean;
  }) => void;
}) {
  const { t } = useT();
  const titleId = useId();
  const [draftImageSrc, setDraftImageSrc] = useState<string | null>(() =>
    userAvatarPhotoSrc(imageSrc)
  );

  const busy = Boolean(disabled) || saveState === "saving";
  const frame = frameToUiRing(cosmeticFrame);
  const shownStatus = resolvedStatus || status;
  const statusKey = avatarStatusMessageKey(shownStatus);
  const sourceKey = avatarStatusSourceKey(statusSource);
  const photoSrc = userAvatarPhotoSrc(draftImageSrc);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function handleCancel() {
    onClose();
  }

  function handleSave() {
    onSave({
      presetId: presetId ?? null,
      imageSrc: userAvatarPhotoSrc(draftImageSrc),
      status: status ?? null,
      autoEnabled: Boolean(autoEnabled),
    });
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="profile-studio-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="profile-studio-shell profile-studio-shell-simple">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div>
            <p id={titleId} className="text-lg font-semibold tracking-tight text-foreground">
              {t("avatar.studio.title")}
            </p>
            <p className="text-sm text-secondary">{t("avatar.studio.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border text-secondary transition hover:bg-surface-secondary hover:text-foreground"
            aria-label={t("avatar.studio.close")}
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </header>

        <div className="profile-studio-body">
          <aside className="profile-studio-preview">
            <Avatar
              name={displayName}
              size="hero"
              shape={photoSrc ? "figure" : "circle"}
              presetId={presetId}
              imageSrc={photoSrc}
              frame={frame}
              presence={presence}
            />
            <p className="mt-4 text-center text-base font-semibold text-foreground">
              {displayName}
            </p>
            <p className="mt-1 text-center text-sm text-secondary">
              {statusKey ? t(statusKey) : t("avatar.statusNone")}
              {statusLive
                ? ` · ${t("avatar.liveNow")}`
                : sourceKey
                  ? ` · ${t(sourceKey)}`
                  : ""}
            </p>
            <p
              className="mt-3 text-center text-xs font-medium"
              aria-live="polite"
              role={saveState === "error" ? "alert" : undefined}
            >
              {saveState === "saving" ? (
                <span className="text-muted">{t("avatar.saving")}</span>
              ) : saveState === "saved" ? (
                <span className="text-success">{t("avatar.saved")}</span>
              ) : saveState === "error" ? (
                <span className="text-error">{saveError || t("errors.saveFailed")}</span>
              ) : null}
            </p>
          </aside>

          <div className="profile-studio-controls profile-studio-controls-simple">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <SelfieAvatarControls
                imageSrc={photoSrc}
                disabled={busy}
                onSelfieChange={(url) => setDraftImageSrc(url)}
              />
            </div>

            <div className="profile-studio-actions">
              <button
                type="button"
                onClick={handleCancel}
                disabled={busy}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-surface-secondary disabled:opacity-50"
              >
                {t("avatar.studio.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={busy}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
              >
                {t("avatar.studio.save")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Kept for profile status editing outside Avatar Studio. */
export function StatusChipPicker({
  status,
  busy,
  onStatusChange,
}: {
  status: string | null;
  busy?: boolean;
  onStatusChange: (status: string | null) => void;
}) {
  const { t } = useT();
  return (
    <div>
      <p id="profile-status-label" className="mb-2 text-sm font-medium text-foreground">
        {t("avatar.status")}
      </p>
      <div
        role="radiogroup"
        aria-labelledby="profile-status-label"
        className="flex flex-wrap gap-2"
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
          const selected =
            status === s ||
            avatarStatusMessageKey(status) === avatarStatusMessageKey(s);
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
              <span className="profile-status-dot" data-status={s} aria-hidden />
              {key ? t(key) : s}
            </button>
          );
        })}
      </div>
    </div>
  );
}
