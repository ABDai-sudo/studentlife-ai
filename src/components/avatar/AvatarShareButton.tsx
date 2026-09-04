"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/LocaleProvider";
import {
  buildAvatarShareText,
  shareTextLooksPrivate,
  type AvatarShareInput,
} from "@/lib/avatar/share-payload";

async function copyShareText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* use the document fallback */
  }
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}

export function AvatarShareButton({ payload }: { payload: AvatarShareInput }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function onShare() {
    setError(false);
    const text = buildAvatarShareText(payload);
    if (!text || shareTextLooksPrivate(text)) {
      setError(true);
      return;
    }
    const data: ShareData = { title: "StudentLife", text };
    try {
      if (typeof navigator.share === "function") {
        const canShare =
          typeof navigator.canShare !== "function" || navigator.canShare(data);
        if (canShare) {
          await navigator.share(data);
          return;
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
    const copiedOk = await copyShareText(text);
    if (copiedOk) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }
    setError(true);
  }

  return (
    <div className="mt-3">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        data-share-state={error ? "error" : copied ? "copied" : "idle"}
        onClick={() => void onShare()}
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden />
        {copied ? t("avatar.shareCopied") : t("avatar.share")}
      </Button>
      {error ? (
        <p className="mt-1 text-xs text-error" role="status">
          {t("avatar.shareFailed")}
        </p>
      ) : null}
    </div>
  );
}
