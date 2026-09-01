import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

const steps = [
  "Enter assignment question",
  "Select subject, marks, and word limit",
  "Upload teacher instructions or notes",
  "Generate outline or editable draft",
  "Review and prepare viva questions",
];

const outputModes = [
  "Outline Only",
  "Guided Draft",
  "Full Draft",
  "Exam-Style Answer",
  "Viva Preparation",
];

export function AssignmentHelperSection() {
  return (
    <section id="assignments" className="section-y-compact border-b border-border bg-surface">
      <div className="container-shell grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
        <div>
          <SectionHeader
            eyebrow="Assignment Helper"
            title="From question to draft — with review built in"
            description="Follow a clear flow for college and school assignments. Generated work is a starting point: read it, understand it, and make it yours."
          />

          <ol className="mt-6 space-y-2.5">
            {steps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 border-b border-border py-2.5 last:border-b-0"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-soft text-[0.7rem] font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-sm font-medium text-foreground">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-sm text-secondary">
            Always review AI output before submission. Use viva prep to check that
            you can explain every section.
          </p>

          <div className="mt-6">
            <Button href="/signup">Start an assignment</Button>
          </div>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">Output modes</p>
            <Badge tone="neutral">Example preview</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {outputModes.map((mode, i) => (
              <span
                key={mode}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  i === 1
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-background text-secondary"
                }`}
              >
                {mode}
              </span>
            ))}
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <p className="text-xs font-medium text-muted">Sample guided draft</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              Explain normalization in DBMS (10 marks)
            </p>
            <ul className="mt-3 space-y-2 text-sm text-secondary">
              <li>1. Define normalization and why it matters</li>
              <li>2. Walk through 1NF → 3NF with one example table</li>
              <li>3. List advantages and a common trade-off</li>
              <li>4. Close with a one-line exam-ready summary</li>
            </ul>
            <p className="mt-3 text-xs text-warning">
              Reminder: edit for your teacher’s rubric and be ready to defend answers in viva.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
