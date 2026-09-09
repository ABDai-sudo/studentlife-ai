"use client";

import { useEffect, useMemo, useState } from "react";
import { DynamicAvatar } from "@/components/avatar/DynamicAvatar";
import { AvatarShareButton } from "@/components/avatar/AvatarShareButton";
import {
  AvatarDevPreview,
  type AvatarDevOverrides,
} from "@/components/avatar/AvatarDevPreview";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useT } from "@/components/i18n/LocaleProvider";
import { getAvatarSpeech } from "@/lib/avatar/speech";
import { avatarStatusMessageKey } from "@/lib/avatar/status-label";
import { displayAvatarStatus } from "@/lib/avatar/presets";
import type { BudgetState } from "@/lib/avatar/budget-state";
import type { AvatarPresence } from "@/lib/avatar/contextual-status";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";

const BUDGET_LABEL: Record<BudgetState, MessageKey> = {
  rich: "avatar.budget.rich",
  mid: "avatar.budget.mid",
  cooked: "avatar.budget.cooked",
};

const SPEECH_LINE: Record<BudgetState, MessageKey> = {
  rich: "avatar.speech.rich",
  mid: "avatar.speech.mid",
  cooked: "avatar.speech.cooked",
};

export type AvatarCardContextView = {
  budget: BudgetState;
  examSeasonActive: boolean;
  institutionName: string | null;
  hasModelPapers: boolean;
  seed: string;
};

export function AvatarStatusCard({
  name,
  presetId,
  imageSrc,
  frame,
  presence,
  status,
  streak,
  context,
}: {
  name: string;
  presetId?: string | null;
  imageSrc?: string | null;
  frame?: "none" | "streak" | "achievement" | "crown";
  presence?: AvatarPresence | null;
  status?: string | null;
  streak?: number;
  context: AvatarCardContextView;
}) {
  const { personality } = useTheme();
  const { t, locale } = useT();
  const [mounted, setMounted] = useState(false);
  const [dev, setDev] = useState<AvatarDevOverrides | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration gate
    setMounted(true);
  }, []);

  const livePersonality = mounted ? personality : "PROFESSIONAL";
  const broLive = livePersonality === "CAMPUS_BRO";
  const slangLive =
    livePersonality === "CAMPUS_BRO" ||
    livePersonality === "CHRONICALLY_ONLINE";

  const budget = dev?.budget ?? context.budget;
  const examSeasonActive = dev?.examSeasonActive ?? context.examSeasonActive;
  const campusSlang = dev ? dev.campusSlang : slangLive;
  const broModeEnabled = dev ? dev.broMode : broLive;

  const speech = useMemo(
    () =>
      getAvatarSpeech({
        budget,
        examSeasonActive,
        institutionName: context.institutionName,
        campusSlang,
        broModeEnabled,
        seed: context.seed,
        hasModelPapers: context.hasModelPapers,
      }),
    [
      budget,
      examSeasonActive,
      context.institutionName,
      context.seed,
      context.hasModelPapers,
      campusSlang,
      broModeEnabled,
    ]
  );

  const localized =
    !broModeEnabled && locale !== "en"
      ? [
          t(SPEECH_LINE[budget]),
          speech.slangLine,
          speech.examLine && context.institutionName
            ? t("avatar.speech.exam", {
                institution: context.institutionName,
              })
            : null,
          speech.papersLine ? t("avatar.speech.papers") : null,
        ]
          .filter((part): part is string => Boolean(part))
          .join(" ")
      : speech.text;

  const statusKey = avatarStatusMessageKey(status);
  const statusLabel = statusKey
    ? t(statusKey)
    : displayAvatarStatus(status) || null;

  return (
    <article
      className="avatar-status-card"
      data-budget={budget}
      aria-label={t("avatar.cardLabel")}
    >
      <div className="flex items-start gap-3">
        <DynamicAvatar
          name={name}
          presetId={presetId}
          imageSrc={imageSrc}
          frame={frame}
          presence={presence}
          size="2xl"
          forceStatic={dev?.forceStatic ?? false}
          force3dFailure={dev?.force3dFailure ?? false}
        />
        <div className="min-w-0 flex-1">
          {statusLabel ? (
            <p className="text-sm font-medium text-secondary">{statusLabel}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted">{t(BUDGET_LABEL[budget])}</p>
          <blockquote className="avatar-speech mt-2.5">
            <p aria-live="polite">{localized}</p>
          </blockquote>
          <AvatarShareButton
            payload={{
              displayName: name,
              status,
              budget,
              streak,
            }}
          />
        </div>
      </div>
      {process.env.NODE_ENV === "development" ? (
        <AvatarDevPreview
          live={{
            budget: context.budget,
            examSeasonActive: context.examSeasonActive,
            campusSlang: slangLive,
            broMode: broLive,
            forceStatic: false,
            force3dFailure: false,
          }}
          value={dev}
          onChange={setDev}
        />
      ) : null}
    </article>
  );
}
