"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { SelfieAvatarControls } from "@/components/avatar/SelfieAvatarControls";
import { useT } from "@/components/i18n/LocaleProvider";
import {
  AVATAR_IDENTITY_LOOKS,
  AVATAR_PRESETS,
  AVATAR_STATUSES,
  frameToUiRing,
  type AvatarFrameId,
} from "@/lib/avatar/presets";
import type { AvatarPresence, AvatarStatusSource } from "@/lib/avatar/contextual-status";
import {
  avatarStatusMessageKey,
  avatarStatusSourceKey,
} from "@/lib/avatar/status-label";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";

type StudioTab =
  | "identity"
  | "face"
  | "hair"
  | "outfit"
  | "accessories"
  | "background"
  | "status";

const TABS: { id: StudioTab; labelKey: MessageKey; soon?: boolean }[] = [
  { id: "identity", labelKey: "avatar.studio.identity" },
  { id: "face", labelKey: "avatar.studio.face", soon: true },
  { id: "hair", labelKey: "avatar.studio.hair", soon: true },
  { id: "outfit", labelKey: "avatar.studio.outfit", soon: true },
  { id: "accessories", labelKey: "avatar.studio.accessories", soon: true },
  { id: "background", labelKey: "avatar.studio.background" },
  { id: "status", labelKey: "avatar.studio.status" },
];

function isCuratedLook(src: string | null | undefined) {
  if (!src) return false;
  return AVATAR_IDENTITY_LOOKS.some((look) => look.imageSrc === src);
}

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
  onPresetChange,
  onSelfieChange,
  onStatusChange,
  onAutoChange,
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
  onPresetChange: (id: string | null) => void;
  onSelfieChange: (url: string | null) => void;
  onStatusChange: (status: string | null) => void;
  onAutoChange?: (auto: boolean) => void;
}) {
  const { t } = useT();
  const titleId = useId();
  const [tab, setTab] = useState<StudioTab>("identity");
  const busy = Boolean(disabled) || saveState === "saving";
  const frame = frameToUiRing(cosmeticFrame);
  const shownStatus = resolvedStatus || status;
  const statusKey = avatarStatusMessageKey(shownStatus);
  const sourceKey = avatarStatusSourceKey(statusSource);
  const yourLookActive = Boolean(imageSrc) && !isCuratedLook(imageSrc);

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

  if (!open) return null;

  return (
    <div
      className="profile-studio-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="profile-studio-shell">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div>
            <p id={titleId} className="text-lg font-semibold tracking-tight text-foreground">
              {t("avatar.studio.title")}
            </p>
            <p className="text-sm text-secondary">{t("avatar.studio.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
              presetId={presetId}
              imageSrc={imageSrc}
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

          <div className="profile-studio-controls">
            <div
              role="tablist"
              aria-label={t("avatar.studio.categories")}
              className="profile-studio-tabs"
            >
              {TABS.map((item) => {
                const selected = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    disabled={item.soon}
                    onClick={() => setTab(item.id)}
                    className={`profile-studio-tab${selected ? " is-selected" : ""}${
                      item.soon ? " is-soon" : ""
                    }`}
                  >
                    {t(item.labelKey)}
                    {item.soon ? (
                      <span className="ms-1 text-[0.65rem] font-medium uppercase tracking-wide opacity-70">
                        {t("avatar.studio.soon")}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto pb-6">
              {tab === "identity" ? (
                <div className="space-y-5">
                  <SelfieAvatarControls
                    imageSrc={yourLookActive ? imageSrc : null}
                    disabled={busy}
                    onSelfieChange={onSelfieChange}
                  />
                  <div>
                    <p className="mb-3 text-sm font-medium text-foreground">
                      {t("avatar.studio.curatedLooks")}
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          onSelfieChange(null);
                          onPresetChange(null);
                        }}
                        className={`profile-look-card${!imageSrc && !presetId ? " is-selected" : ""}`}
                      >
                        <Avatar name={displayName} size="lg" presetId={null} />
                        <span>{t("avatar.initialsOption")}</span>
                      </button>
                      {AVATAR_IDENTITY_LOOKS.map((look) => {
                        const selected = imageSrc === look.imageSrc;
                        return (
                          <button
                            key={look.id}
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              onPresetChange(null);
                              onSelfieChange(look.imageSrc);
                            }}
                            className={`profile-look-card${selected ? " is-selected" : ""}`}
                          >
                            <Avatar
                              name={t(look.labelKey)}
                              size="lg"
                              imageSrc={look.imageSrc}
                            />
                            <span>{t(look.labelKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === "background" ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">
                    {t("avatar.studio.themeHint")}
                  </p>
                  <div
                    role="radiogroup"
                    aria-label={t("avatar.studio.background")}
                    className="grid grid-cols-4 gap-2 sm:grid-cols-6"
                  >
                    {AVATAR_PRESETS.map((p) => {
                      const selected = !imageSrc && presetId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={busy}
                          onClick={() => {
                            onSelfieChange(null);
                            onPresetChange(p.id);
                          }}
                          className={`avatar-option min-h-[4.5rem] ${
                            selected ? "avatar-option-selected" : ""
                          }`}
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
              ) : null}

              {tab === "status" ? (
                <div className="space-y-4">
                  {onAutoChange ? (
                    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-border bg-surface-secondary/50 px-4 py-3">
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
                        aria-checked={Boolean(autoEnabled)}
                        disabled={busy}
                        onClick={() => onAutoChange(!autoEnabled)}
                        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                          autoEnabled ? "bg-primary" : "bg-border"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 start-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            autoEnabled
                              ? "translate-x-5 rtl:-translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </label>
                  ) : null}
                  <StatusChipPicker
                    status={status}
                    busy={busy}
                    onStatusChange={onStatusChange}
                  />
                </div>
              ) : null}

              {TABS.find((item) => item.id === tab)?.soon ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface-secondary/40 px-5 py-10 text-center">
                  <p className="text-base font-semibold text-foreground">
                    {t("avatar.studio.comingSoonTitle")}
                  </p>
                  <p className="mt-2 text-sm text-secondary">
                    {t("avatar.studio.comingSoonBody")}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
