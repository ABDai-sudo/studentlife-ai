"use client";

import { Flame, Target, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useT } from "@/components/i18n/LocaleProvider";
import { getCopy } from "@/lib/personality";
import {
  AvatarStatusCard,
  type AvatarCardContextView,
} from "@/components/avatar/AvatarStatusCard";
import type { AvatarPresence, AvatarStatusSource } from "@/lib/avatar/contextual-status";

type Quest = {
  id: string;
  title: string;
  status: string;
  xpReward: number;
};

export type GamificationSummary = {
  xpTotal: number;
  level: number;
  levelName: string;
  xpToNext: number;
  levelProgress: number;
  academicAura: number;
  displayName: string | null;
  avatarPresetId: string | null;
  avatarImageUrl: string | null;
  avatarStatus: string | null;
  avatarPresence?: AvatarPresence | null;
  avatarStatusSource?: AvatarStatusSource | null;
  avatarStatusLive?: boolean;
  avatarFrameUi: "none" | "streak" | "achievement" | "crown";
  todayComplete: boolean;
  questsDone: number;
  questsTotal: number;
  streak: { current: number; best: number; lastLoggedAt: string | null };
  quests: Quest[];
};

function fillN(template: string, n: number) {
  return template.replaceAll("{n}", String(n));
}

export function DashboardGamificationHeader({
  userName,
  initialData,
  avatarContext,
}: {
  userName: string;
  initialData: GamificationSummary | null;
  loadError?: string | null;
  avatarContext: AvatarCardContextView;
}) {
  const { personality } = useTheme();
  const { t, locale } = useT();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // First paint must match SSR (ThemeProvider SSRs as PROFESSIONAL).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration gate
    setMounted(true);
  }, []);
  // Root ThemeProvider SSRs as PROFESSIONAL; wait until mount before using
  // the client store so English personality copy does not hydrate-mismatch.
  const copy = getCopy(mounted ? personality : "PROFESSIONAL");
  const data = initialData;
  const loadState: "ready" | "error" = data ? "ready" : "error";

  const display = data?.displayName?.trim() || userName;
  const streak = data?.streak.current ?? 0;
  const todayComplete = data?.todayComplete ?? false;

  const message = (() => {
    if (!data) return t("errors.loadFailed");
    if (todayComplete) {
      return locale === "en"
        ? copy.streaks.secured
        : t("dashboard.streakSafe", { streak });
    }
    if (streak <= 0) {
      return locale === "en" ? copy.streaks.start : t("dashboard.streakStart");
    }
    return locale === "en"
      ? fillN(copy.streaks.maintain, streak)
      : t("dashboard.streakMaintain", { streak });
  })();

  return (
    <section
      className="mb-8 space-y-6"
      aria-label={t("dashboard.studyProgress")}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <AvatarStatusCard
          name={display}
          presetId={data?.avatarPresetId}
          imageSrc={data?.avatarImageUrl}
          frame={data?.avatarFrameUi ?? "none"}
          presence={data?.avatarPresence}
          status={data?.avatarStatus}
          streak={streak}
          context={avatarContext}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted">
            {t("dashboard.welcomeLabel")}
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {display}
          </h2>
          {data ? (
            <p className="mt-2 text-sm text-muted">
              {t("dashboard.days", { count: streak })}
              <span aria-hidden> · </span>
              {t("dashboard.level", { level: data.level })}
              <span aria-hidden> · </span>
              {t("dashboard.auraLabel", { value: data.academicAura })}
            </p>
          ) : null}
          <p className="mt-3 text-base leading-relaxed text-secondary">
            {message}
          </p>
          {loadState === "error" ? (
            <div className="mt-4">
              <Button
                size="sm"
                variant="secondary"
                className="min-h-11"
                onClick={() => window.location.reload()}
              >
                {t("actions.retry")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-8 border-t border-border pt-6 sm:grid-cols-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            <Flame
              className={`h-3.5 w-3.5 ${todayComplete ? "text-success" : "text-warning"}`}
              aria-hidden
            />
            {t("dashboard.currentStreak")}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            {data ? streak : "—"}
            <span className="ms-1.5 text-base font-medium text-secondary">
              {t("dashboard.dayUnit")}
            </span>
          </p>
          <p className="mt-1 text-sm text-secondary">
            {todayComplete
              ? t("dashboard.todaySecured")
              : t("dashboard.keepAlive")}
          </p>
          {data ? (
            <p className="mt-1 text-sm text-muted">
              {t("dashboard.bestStreak")} · {data.streak.best}
            </p>
          ) : null}
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden />
            {t("dashboard.xp")}
          </p>
          {data ? (
            <>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {data.levelName}
              </p>
              <p className="mt-0.5 text-sm text-secondary">
                {t("dashboard.level", { level: data.level })} · {data.xpTotal}{" "}
                {t("dashboard.xp")}
              </p>
              <ProgressBar
                className="mt-3"
                value={data.levelProgress}
                label={
                  data.xpToNext > 0
                    ? t("dashboard.xpToNext", { xp: data.xpToNext })
                    : t("dashboard.maxLevel")
                }
              />
              <p className="mt-2 flex items-center gap-1.5 text-sm text-secondary">
                <Target className="h-3.5 w-3.5 text-primary" aria-hidden />
                {t("dashboard.academicAura")} · {data.academicAura}/100
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">{t("errors.loadFailed")}</p>
          )}
        </div>
      </div>

      <div className="grid gap-8 border-t border-border pt-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {t("dashboard.todaysQuests")}
            {data
              ? ` · ${t("dashboard.questsProgress", {
                  done: data.questsDone,
                  total: data.questsTotal || 3,
                })}`
              : ""}
          </p>
          <ul className="mt-2 divide-y divide-border">
            {(data?.quests ?? []).slice(0, 3).map((quest) => (
              <li
                key={quest.id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span
                  className={
                    quest.status === "COMPLETED"
                      ? "text-muted line-through"
                      : "font-medium text-foreground"
                  }
                >
                  {quest.title}
                </span>
                <span className="shrink-0 text-sm text-secondary">
                  +{quest.xpReward} {t("dashboard.xp")}
                </span>
              </li>
            ))}
            {loadState === "ready" && !data?.quests?.length ? (
              <li className="py-2.5 text-sm text-muted">
                {t("empty.noQuestsBody")}
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">
            {t("dashboard.quickActions")}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button href="/dashboard/study-buddy" size="sm" className="min-h-11 w-full">
              {t("nav.studyBuddy")}
            </Button>
            <Button
              href="/dashboard/ai-tutor"
              variant="secondary"
              size="sm"
              className="min-h-11 w-full"
            >
              {t("actions.askTutor")}
            </Button>
            <Button
              href="/dashboard/assignments"
              variant="secondary"
              size="sm"
              className="min-h-11 w-full"
            >
              {t("nav.assignments")}
            </Button>
            <Button
              href="/dashboard/games"
              variant="secondary"
              size="sm"
              className="min-h-11 w-full"
            >
              {t("nav.games")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
