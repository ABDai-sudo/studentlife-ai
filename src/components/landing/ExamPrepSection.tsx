import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

const features = [
  "College-aware Question Generator",
  "Chapter tests",
  "Internal exams",
  "Semester mock papers",
  "MCQs",
  "Short and long questions",
  "Coding and practical questions",
  "Viva questions",
  "Answer keys",
];

export function ExamPrepSection() {
  return (
    <section id="exam-prep" className="section-y-compact border-b border-border bg-background">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Question Generator & Exam Prep"
          title="Practice like the real paper"
          description="Generate chapter tests, mock papers, and viva sets tuned to your course and semester — with structure that looks like an exam sheet."
          className="mb-8"
        />

        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <ul className="divide-y divide-border border-t border-border">
              {features.map((item) => (
                <li
                  key={item}
                  className="py-2.5 text-sm font-medium text-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <Button href="/signup" variant="secondary">
                Generate a practice paper
              </Button>
            </div>
          </div>

          <article
            className="overflow-hidden border-t border-border pt-5 lg:border-t-0 lg:border-s lg:ps-8 lg:pt-0"
            aria-label="Sample exam paper preview"
          >
            <div className="border-b border-border pb-3 text-center">
              <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted">
                Example paper · sample data
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                Sample University · B.Tech CSE
              </p>
              <p className="text-xs text-secondary">
                Semester 3 · Data Structures · Duration 90 min · Total 50 marks
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">
                    Section A — MCQs (10 marks)
                  </p>
                  <Badge tone="neutral">Answer key included</Badge>
                </div>
                <p className="text-sm text-secondary">
                  1. Time complexity of binary search on a sorted array is…
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground">
                  Section B — Short answers (20 marks)
                </p>
                <p className="text-sm text-secondary">
                  2. Differentiate stack and queue with one real-world example each.
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground">
                  Section C — Long / coding (20 marks)
                </p>
                <p className="text-sm text-secondary">
                  3. Write an algorithm to reverse a singly linked list. State space and time complexity.
                </p>
              </div>
              <p className="pt-2 text-xs text-muted">
                Viva set available after submission · 8 oral questions with model points
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
