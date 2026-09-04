"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import type { LoginPresentationId } from "@/lib/avatar/login-preview";
import { LOGIN_PRESENTATIONS } from "@/lib/avatar/login-preview";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";

const LABEL_KEY: Record<LoginPresentationId, MessageKey> = {
  male: "login.preview.male",
  female: "login.preview.female",
  neutral: "login.preview.neutral",
  custom: "login.preview.custom",
};

export function LoginPreviewSwitcher({
  value,
  onChange,
}: {
  value: LoginPresentationId;
  onChange: (next: LoginPresentationId) => void;
}) {
  const { t } = useT();

  return (
    <div
      className="login-preview-switch"
      role="radiogroup"
      aria-label={t("login.preview.label")}
    >
      {LOGIN_PRESENTATIONS.map((id) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(id)}
            className={`login-preview-chip${selected ? " is-selected" : ""}`}
          >
            {t(LABEL_KEY[id])}
          </button>
        );
      })}
    </div>
  );
}
