import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

const contextChips = [
  "College or school",
  "University or board",
  "Course",
  "Semester",
  "Subject",
  "Chapter",
  "Uploaded syllabus",
  "Upcoming exams",
  "Pending assignments",
  "Preferred explanation style",
];

const actionCards = [
  "Ask Anything",
  "Explain My Notes",
  "Help With Assignment",
  "Generate Question Paper",
  "Test Me",
  "Upload a Question",
];

const responseModes = [
  "Explain Simply",
  "Exam-Ready Answer",
  "Give Example",
  "Create Notes",
  "Test Me",
];

export function AITutorSection() {
  return (
    <section id="ai-tutor" className="section-y-compact border-b border-border bg-background">
      <div className="container-shell">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
          <div>
            <SectionHeader
              eyebrow="Personalized AI Tutor"
              title="Answers that use your course context"
              description="StudentLife AI uses your school or college profile, subjects, syllabus, and deadlines so answers feel relevant — not generic."
            />

            <div className="mt-5 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
              {contextChips.map((chip) => (
                <p key={chip} className="text-sm text-secondary">
                  {chip}
                </p>
              ))}
            </div>

            <ul className="mt-6 divide-y divide-border border-t border-border">
              {actionCards.map((action) => (
                <li
                  key={action}
                  className="py-2.5 text-sm font-medium text-foreground"
                >
                  {action}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button href="/signup">
                Try AI Tutor
              </Button>
            </div>
          </div>

          <div className="overflow-hidden border-t border-border">
            <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">AI Tutor</p>
                <p className="text-xs text-muted">Example conversation · sample data</p>
              </div>
              <Badge tone="primary">Study session</Badge>
            </div>

            <div className="space-y-3 bg-background px-4 py-4">
              <div className="ml-auto max-w-[90%] rounded-xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm text-white">
                Tomorrow I have a test on C programming algorithms.
              </div>
              <div className="max-w-[94%] rounded-2xl rounded-bl-md border border-border bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
                I’ll prepare you using short notes, important questions, five
                MCQs, and a quick revision plan.
              </div>
            </div>

            <div className="border-t border-border px-4 py-3">
              <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
                Response modes
              </p>
              <div className="flex flex-wrap gap-2">
                {responseModes.map((mode) => (
                  <span
                    key={mode}
                    className="rounded-md border border-border bg-surface-secondary px-2.5 py-1 text-[0.7rem] font-medium text-secondary"
                  >
                    {mode}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
