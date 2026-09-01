import { SectionHeader } from "@/components/ui/SectionHeader";

const steps = [
  {
    step: "Step 1",
    title: "Add your classes",
    description: "Write each class name and when it happens. Keep it short.",
    preview: ["Maths — Mon 10 AM", "Science — Tue 2 PM", "English — Wed 11 AM"],
  },
  {
    step: "Step 2",
    title: "Save homework and notes",
    description:
      "Add what you must finish and short notes from class. One page at a time.",
    preview: ["Homework due Friday", "Exam next week", "Class notes saved"],
  },
  {
    step: "Step 3",
    title: "Ask the tutor when you need help",
    description:
      "Type your question in plain language. Example: “Explain this chapter simply.”",
    preview: ["Simple explanation", "Study plan", "Practice questions"],
  },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="section-y border-b border-border bg-background">
      <div className="container-shell">
        <SectionHeader
          eyebrow="How to use"
          title="Three steps to get started"
          description="Open the app every day, check what’s next, and finish one task at a time."
          className="mb-10"
        />

        <div className="grid gap-8 lg:grid-cols-3">
          {steps.map(({ step, title, description, preview }) => (
            <article key={step} className="border-t border-border pt-5 lg:border-t-0 lg:pt-0">
              <p className="text-xs font-medium text-muted">{step}</p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                {description}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-secondary">
                {preview.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
