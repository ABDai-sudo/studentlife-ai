import { BookOpen, Brain, CalendarDays } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

const steps = [
  {
    step: "Step 1",
    title: "Add your classes",
    description: "Write each class name and when it happens. Keep it short.",
    icon: CalendarDays,
    preview: ["Maths — Mon 10 AM", "Science — Tue 2 PM", "English — Wed 11 AM"],
  },
  {
    step: "Step 2",
    title: "Save homework and notes",
    description:
      "Add what you must finish and short notes from class. One page at a time.",
    icon: BookOpen,
    preview: ["Homework due Friday", "Exam next week", "Class notes saved"],
  },
  {
    step: "Step 3",
    title: "Ask AI when you need help",
    description:
      "Type your question in normal language. Example: “Explain this chapter simply.”",
    icon: Brain,
    preview: ["Simple explanation", "Study plan", "Practice questions"],
  },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="section-y border-b border-border bg-background">
      <div className="container-shell">
        <SectionHeader
          eyebrow="How to use"
          title="Three easy steps. That’s it."
          description="Open the app every day, check what’s next, and finish one task at a time."
          className="mb-10"
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {steps.map(({ step, title, description, icon: Icon, preview }) => (
            <article key={step} className="card-elevated p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-md bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                  {step}
                </span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                {description}
              </p>
              <div className="mt-4 space-y-2 rounded-xl border border-border bg-background p-3">
                {preview.map((line) => (
                  <div
                    key={line}
                    className="rounded-lg bg-surface-secondary px-2.5 py-2 text-sm font-medium text-foreground"
                  >
                    {line}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
