"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/LocaleProvider";

export function DashboardStartHere({
  name,
  hasExam,
}: {
  name: string;
  hasExam: boolean;
}) {
  const { t } = useT();
  return (
    <section
      className="mb-6 rounded-2xl border border-border bg-surface p-4 sm:p-5"
      aria-label={t("dashboard.startHere")}
    >
      <p className="text-sm font-medium text-muted">{t("dashboard.welcomeNewLabel")}</p>
      <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
        {t("dashboard.welcomeNew", { name })}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-secondary">
        {t("dashboard.startHereBody")}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button href="/dashboard/ai-tutor" className="min-h-11 w-full justify-center">
          {t("dashboard.startTutor")}
        </Button>
        <Button
          href="/dashboard/study-buddy"
          variant="secondary"
          className="min-h-11 w-full justify-center"
        >
          {t("dashboard.startBuddy")}
        </Button>
        <Button
          href={hasExam ? "/dashboard/exam-prep" : "/dashboard/exams"}
          variant="secondary"
          className="min-h-11 w-full justify-center"
        >
          {t("dashboard.startExam")}
        </Button>
        <Button
          href="/dashboard/assignments"
          variant="secondary"
          className="min-h-11 w-full justify-center"
        >
          {t("dashboard.startAssignment")}
        </Button>
        <Button
          href="/dashboard/money"
          variant="secondary"
          className="min-h-11 w-full justify-center sm:col-span-2"
        >
          {t("dashboard.startMoney")}
        </Button>
      </div>
    </section>
  );
}
