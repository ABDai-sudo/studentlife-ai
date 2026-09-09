"use client";

import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { compressSelfieFile } from "@/lib/avatar/selfie";

export function SelfieAvatarControls({
  imageSrc,
  disabled,
  onSelfieChange,
  compact = false,
}: {
  imageSrc?: string | null;
  disabled?: boolean;
  onSelfieChange: (dataUrl: string | null) => void;
  compact?: boolean;
}) {
  const { t } = useT();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleFile(file: File | null | undefined) {
    if (!file || disabled || busy) return;
    setLocalError(null);
    setBusy(true);
    try {
      const dataUrl = await compressSelfieFile(file);
      onSelfieChange(dataUrl);
    } catch {
      setLocalError(t("avatar.selfieError"));
    } finally {
      setBusy(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }

  return (
    <div
      className={
        compact
          ? "space-y-3"
          : "space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
      }
    >
      {!compact ? (
        <div>
          <p className="text-base font-semibold tracking-tight text-foreground">
            {t("avatar.createYourLook")}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-secondary">
            {t("avatar.createYourLookHint")}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => cameraRef.current?.click()}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60 sm:flex-none"
        >
          <Camera className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {busy ? t("avatar.selfieProcessing") : t("avatar.selfieCamera")}
        </button>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => galleryRef.current?.click()}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface-secondary px-4 text-sm font-semibold text-foreground transition hover:bg-surface disabled:opacity-60 sm:flex-none"
        >
          <ImagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {t("avatar.selfieUpload")}
        </button>
        {imageSrc ? (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => onSelfieChange(null)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-error transition hover:bg-error-soft disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            {t("avatar.selfieRemove")}
          </button>
        ) : null}
      </div>

      {localError ? (
        <p className="text-xs font-medium text-error" role="alert">
          {localError}
        </p>
      ) : null}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
