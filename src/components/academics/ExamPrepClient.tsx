"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/LocaleProvider";

export function ExamPrepClient() {
  const { t } = useT();

  const items = [
    {
      title: t("examPrep.papersTitle"),
      body: t("examPrep.papersBody"),
      href: "/dashboard/question-generator",
      label: t("examPrep.openGenerator"),
      variant: "primary" as const,
    },
    {
      title: t("tutor.title"),
      body: t("examPrep.tutorBody"),
      href: "/dashboard/ai-tutor",
      label: t("examPrep.openTutor"),
      variant: "primary" as const,
    },
    {
      title: t("examPrep.emergencyTitle"),
      body: t("examPrep.emergencyBody"),
      href: "/dashboard/emergency",
      label: t("examPrep.imCooked"),
      variant: "secondary" as const,
    },
    {
      title: t("examPrep.examsTitle"),
      body: t("examPrep.examsBody"),
      href: "/dashboard/exams",
      label: t("examPrep.manageExams"),
      variant: "secondary" as const,
    },
    {
      title: t("games.focusSprint"),
      body: t("examPrep.focusBody"),
      href: "/dashboard/progress",
      label: t("examPrep.startProgress"),
      variant: "secondary" as const,
    },
    {
      title: t("nav.notes"),
      body: t("examPrep.notesBody"),
      href: "/dashboard/notes",
      label: t("examPrep.openNotes"),
      variant: "secondary" as const,
    },
  ];

  return (
    <div className="divide-y divide-border border-t border-border">
      {items.map((item) => (
        <div
          key={item.href + item.title}
          className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8"
        >
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-secondary">{item.body}</p>
          </div>
          <Button
            href={item.href}
            variant={item.variant}
            className="shrink-0 sm:mt-0.5"
          >
            {item.label}
          </Button>
        </div>
      ))}
    </div>
  );
}
