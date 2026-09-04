"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/LocaleProvider";
import type { DashboardFocusItem } from "@/services/dashboard-focus.service";

export function DashboardFocusStrip({
  nextDeadline,
  nextQuestTitle,
  todayComplete,
}: {
  nextDeadline: DashboardFocusItem | null;
  nextQuestTitle: string | null;
  todayComplete: boolean;
}) {
  const { t } = useT();
  const doNow = todayComplete
    ? t("dashboard.focus.streakSafe")
    : nextQuestTitle || t("dashboard.focus.startStudy");
  const deadlineHref =
    nextDeadline?.kind === "exam"
      ? "/dashboard/exam-prep"
      : "/dashboard/assignments";

  return (
    <section
      className="dashboard-focus mb-6 rounded-2xl border border-border bg-surface p-4 sm:p-5"
      aria-label={t("dashboard.focus.label")}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {t("dashboard.focus.doNow")}
          </p>
          <p className="mt-1 text-base font-semibold leading-snug text-foreground">
            {doNow}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {t("dashboard.importantDeadline")}
          </p>
          {nextDeadline ? (
            <>
              <p className="mt-1 text-base font-semibold leading-snug text-foreground">
                {nextDeadline.title}
              </p>
              <p className="mt-0.5 text-sm text-secondary">
                {nextDeadline.subject ? `${nextDeadline.subject} · ` : ""}
                {nextDeadline.date}
              </p>
              <Button
                href={deadlineHref}
                size="sm"
                variant="secondary"
                className="mt-2 min-h-11"
              >
                {t("dashboard.focus.openDeadline")}
              </Button>
            </>
          ) : (
            <p className="mt-1 text-sm text-secondary">
              {t("dashboard.noDeadline")}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {t("nav.studyBuddy")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-secondary">
            {t("dashboard.focus.buddyHint")}
          </p>
          <Button href="/dashboard/study-buddy" size="sm" className="mt-2 min-h-11">
            {t("dashboard.focus.openBuddy")}
          </Button>
        </div>
      </div>
    </section>
  );
}
