"use client";

import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { compressSelfieFile } from "@/lib/avatar/selfie";

export function SelfieAvatarControls({
  imageSrc,
  disabled,
  onSelfieChange,
}: {
  imageSrc?: string | null;
  disabled?: boolean;
  onSelfieChange: (dataUrl: string | null) => void;
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
    <div className="space-y-3 rounded-xl border border-border bg-surface-secondary/40 p-3.5">
      <div>
        <p className="text-sm font-semibold text-foreground">{t("avatar.selfieTitle")}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{t("avatar.selfieHint")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => cameraRef.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-secondary disabled:opacity-60"
        >
          <Camera className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {busy ? t("avatar.selfieProcessing") : t("avatar.selfieCamera")}
        </button>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => galleryRef.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-secondary disabled:opacity-60"
        >
          <ImagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {t("avatar.selfieUpload")}
        </button>
        {imageSrc ? (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => onSelfieChange(null)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-error hover:bg-error-soft disabled:opacity-60"
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
