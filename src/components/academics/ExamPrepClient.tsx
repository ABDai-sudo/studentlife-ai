"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/LocaleProvider";
import { localizedBuddyReason } from "@/lib/i18n/localized-content";
import type { ExamPrepWorkflow } from "@/services/exam-prep.service";

export function ExamPrepClient({ workflow }: { workflow: ExamPrepWorkflow }) {
  const { t } = useT();
  const next = workflow.nextExam;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("examPrep.workflow")}
        </p>
        {next ? (
          <>
            <h2 className="mt-1 text-xl font-semibold text-foreground">{next.title}</h2>
            <p className="mt-1 text-sm text-secondary">
              {next.subject}
              {next.examType ? ` · ${next.examType}` : ""} · {next.examDate}
            </p>
            <p className="mt-3 text-2xl font-semibold text-foreground">
              {next.daysLeft === 1
                ? t("examPrep.daysLeftOne")
                : t("examPrep.daysLeft", { n: next.daysLeft })}
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {t("examPrep.noExam")}
            </h2>
            <p className="mt-1 text-sm text-secondary">{t("examPrep.examsBody")}</p>
            <Button href="/dashboard/exams" className="mt-4 min-h-11">
              {t("examPrep.addExam")}
            </Button>
          </>
        )}
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground">
          {t("examPrep.studyToday")}
        </h3>
        {workflow.studyNow ? (
          <div className="mt-2 rounded-xl border border-border p-4">
            <p className="font-medium text-foreground">{workflow.studyNow.title}</p>
            {workflow.studyNow.subject ? (
              <p className="mt-0.5 text-sm text-secondary">{workflow.studyNow.subject}</p>
            ) : null}
            <p className="mt-2 text-sm text-secondary">
              {localizedBuddyReason(workflow.studyNow.reason, t)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t("buddy.minutes", { n: workflow.studyNow.minutes })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button href="/dashboard/study-buddy" className="min-h-11">
                {t("examPrep.startSession")}
              </Button>
              {workflow.emergencyRecommended ? (
                <Button href="/dashboard/emergency" variant="secondary" className="min-h-11">
                  {t("examPrep.emergencyFit")}
                </Button>
              ) : (
                <Button href="/dashboard/emergency" variant="secondary" className="min-h-11">
                  {t("examPrep.imCooked")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-secondary">{t("buddy.studyNowEmpty")}</p>
        )}
      </section>

      {workflow.relatedTasks.length > 0 ? (
        <section>
          <h3 className="text-base font-semibold text-foreground">
            {t("examPrep.topicsToday")}
          </h3>
          <ul className="mt-2 divide-y divide-border">
            {workflow.relatedTasks.map((task) => (
              <li key={task.id} className="flex justify-between gap-3 py-2.5 text-sm">
                <span className="font-medium">{task.title}</span>
                <span className="shrink-0 text-muted">{task.dueDate}</span>
              </li>
            ))}
          </ul>
          <Button href="/dashboard/assignments" variant="secondary" size="sm" className="mt-3 min-h-11">
            {t("nav.assignments")}
          </Button>
        </section>
      ) : null}

      <section className="border-t border-border pt-6">
        <h3 className="mb-3 text-sm font-semibold text-muted">
          {t("examPrep.otherTools")}
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button href="/dashboard/question-generator" variant="secondary" className="min-h-11 justify-start">
            {t("examPrep.openGenerator")}
          </Button>
          <Button href="/dashboard/ai-tutor" variant="secondary" className="min-h-11 justify-start">
            {t("examPrep.openTutor")}
          </Button>
          <Button href="/dashboard/notes" variant="secondary" className="min-h-11 justify-start">
            {t("examPrep.openNotes")}
          </Button>
          <Button href="/dashboard/exams" variant="secondary" className="min-h-11 justify-start">
            {t("examPrep.manageExams")}
          </Button>
        </div>
      </section>
    </div>
  );
}
