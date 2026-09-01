import {
  BookOpenCheck,
  CalendarCheck2,
  ClipboardCheck,
  NotebookPen,
  Target,
  Wallet,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

const outcomes = [
  {
    icon: ClipboardCheck,
    title: "Fewer missed assignments",
    description: "Due dates and priorities stay visible across the week.",
  },
  {
    icon: Target,
    title: "Better exam preparation",
    description: "Notes, countdowns, and revision prompts sit together.",
  },
  {
    icon: NotebookPen,
    title: "Organized notes",
    description: "Lecture notes stay grouped by subject and easy to find.",
  },
  {
    icon: BookOpenCheck,
    title: "Clear weekly study plan",
    description: "AI suggestions fit around your timetable, not against it.",
  },
  {
    icon: CalendarCheck2,
    title: "Improved attendance awareness",
    description: "Track presence early before thresholds become a problem.",
  },
  {
    icon: Wallet,
    title: "Better control of student spending",
    description: "Optional budgeting stays available without taking over the product.",
  },
];

export function OutcomesSection() {
  return (
    <section id="outcomes" className="section-y border-b border-border bg-surface">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Outcomes"
          title="Results students actually use"
          description="Clearer academic routines and fewer dropped tasks — without inflated claims."
          className="mb-10"
        />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {outcomes.map(({ icon: Icon, title, description }) => (
            <article key={title} className="border-t border-border pt-5">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
              <h3 className="mt-3 text-base font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
