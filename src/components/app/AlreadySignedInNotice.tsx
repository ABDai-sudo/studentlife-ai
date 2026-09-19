"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/LocaleProvider";

export function AlreadySignedInNotice({ notice }: { notice?: string }) {
  const { t } = useT();
  const router = useRouter();

  if (notice !== "already-signed-in") return null;

  return (
    <div
      className="mb-4 rounded-xl border border-primary/25 bg-primary-soft px-4 py-3 text-[0.9375rem] leading-relaxed text-foreground"
      role="status"
    >
      <p className="font-semibold">{t("auth.alreadySignedIn")}</p>
      <p className="mt-1 text-secondary">{t("auth.alreadySignedInHint")}</p>
      <button
        type="button"
        className="mt-2 text-sm font-semibold text-primary underline-offset-2 hover:underline"
        onClick={() => router.replace("/dashboard")}
      >
        {t("actions.close")}
      </button>
    </div>
  );
}
