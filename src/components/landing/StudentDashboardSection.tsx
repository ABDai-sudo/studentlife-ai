import { Brain, ClipboardList, StickyNote, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductWindow } from "@/components/landing/ProductWindow";

export function StudentDashboardSection() {
  return (
    <section id="dashboard" className="section-y border-b border-border bg-surface">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Student dashboard"
          title="One morning view for the whole academic day"
          description="Greeting, schedule, deadlines, progress, and a focused AI recommendation—finance stays secondary."
          className="mb-10"
        />

        <ProductWindow title="Dashboard · Alex">
          <div className="bg-background p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xl font-semibold text-foreground">
                  Good morning, Alex
                </p>
                <p className="text-sm text-muted">Thursday, 23 July 2026</p>
              </div>
              <Badge tone="primary">Next class · Algorithms · 25 min</Badge>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <div className="card-surface p-4 lg:col-span-2">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Tasks due today
                </div>
                {[
                  "Finish DBMS ER diagram",
                  "Upload OS lab screenshots",
                  "Review Networks chapter 5",
                ].map((task) => (
                  <div
                    key={task}
                    className="mb-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground last:mb-0"
                  >
                    {task}
                  </div>
                ))}
              </div>

              <div className="card-surface p-4">
                <p className="text-sm font-semibold text-foreground">Weekly progress</p>
                <ProgressBar value={68} className="mt-3" label="Study plan" />
                <ProgressBar
                  value={86}
                  className="mt-3"
                  label="Attendance"
                  tone="success"
                />
                <p className="mt-4 text-xs text-muted">Exam countdown · 9 days</p>
              </div>

              <div className="card-surface border-ai/20 bg-ai-soft/50 p-4 lg:col-span-2">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Brain className="h-4 w-4 text-ai" />
                  AI study recommendation
                </div>
                <p className="text-sm leading-relaxed text-secondary">
                  Block 40 minutes tonight for congestion control, then generate
                  five practice questions from your Networks notes.
                </p>
              </div>

              <div className="card-surface p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <StickyNote className="h-4 w-4 text-primary" />
                  Recent note
                </div>
                <p className="text-sm font-medium text-foreground">
                  Normalization forms
                </p>
                <p className="mt-1 text-xs text-muted">Updated yesterday</p>
              </div>

              <div className="card-surface p-4 lg:col-span-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Wallet className="h-4 w-4 text-muted" />
                    Expense summary
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-secondary">
                      Left <strong className="text-foreground">₹1,350</strong>
                    </span>
                    <span className="text-secondary">
                      Safe/day <strong className="text-foreground">₹122</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ProductWindow>
      </div>
    </section>
  );
}
