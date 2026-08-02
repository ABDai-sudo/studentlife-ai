import { Copy, Paperclip, RefreshCw, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

const prompts = [
  "Explain database normalization with an example.",
  "Create a seven-day revision plan for my exam.",
  "Generate ten viva questions from these notes.",
  "Summarize this chapter in simple language.",
];

const useCases = [
  "Turn lecture notes into clear explanations",
  "Build revision plans around your exam dates",
  "Practice with viva-style questions before assessments",
];

export function AITutorSection() {
  return (
    <section id="ai-tutor" className="section-y border-b border-border bg-surface">
      <div className="container-shell grid items-center gap-10 lg:grid-cols-2">
        <div>
          <SectionHeader
            eyebrow="AI Tutor"
            title="Study support grounded in your coursework"
            description="Ask for explanations, revision plans, and practice questions without leaving your notes and timetable."
          />
          <ul className="mt-6 space-y-3">
            {useCases.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-secondary"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ai" />
                <span className="font-medium text-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <Button href="/signup" variant="ai">
              Try AI Tutor free
            </Button>
          </div>
        </div>

        <div className="card-elevated overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-ai-soft/40 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">AI Tutor</p>
              <p className="text-xs text-muted">Connected to DBMS notes</p>
            </div>
            <Badge tone="ai">Study session</Badge>
          </div>

          <div className="space-y-3 bg-background px-4 py-4">
            <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-ai px-3.5 py-2.5 text-sm text-white">
              Explain database normalization with an example.
            </div>
            <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-border bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
              Normalization organizes tables to reduce redundancy. Example: split
              a student-course table so course details live once, then reference
              them with a course ID.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-secondary"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy answer
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-secondary"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {prompts.slice(1).map((prompt) => (
                <span
                  key={prompt}
                  className="rounded-md border border-border bg-surface-secondary px-2.5 py-1 text-[0.7rem] text-secondary"
                >
                  {prompt}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
              <Paperclip className="h-4 w-4 text-muted" aria-hidden />
              <span className="flex-1 text-sm text-muted">Ask the AI Tutor…</span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ai text-white">
                <Send className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-2 text-[0.7rem] text-muted">
              Source attachment · DBMS_notes.pdf
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
