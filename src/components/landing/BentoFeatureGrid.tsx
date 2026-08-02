import type { ReactNode } from "react";
import {
  BookOpen,
  Brain,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  StickyNote,
  Target,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function BentoFeatureGrid() {
  return (
    <section id="features" className="section-y border-b border-border bg-background">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Core features"
          title="Every academic tool with a purpose-built layout"
          description="Different modules get different interfaces—so the product feels complete without becoming cluttered."
          className="mb-10"
        />

        <div className="grid gap-4 md:grid-cols-6">
          {/* AI Tutor - wide */}
          <article className="card-elevated p-5 md:col-span-3 md:row-span-2">
            <Header icon={Brain} title="AI Tutor" tone="ai" />
            <div className="mt-4 space-y-2.5 rounded-xl border border-border bg-surface-secondary/70 p-3">
              <Bubble mine>Explain database normalization with an example.</Bubble>
              <Bubble>
                Start with 1NF: remove repeating groups. Then 2NF for partial
                dependencies, and 3NF for transitive ones…
              </Bubble>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge tone="ai">Revision plan</Badge>
                <Badge tone="neutral">Viva questions</Badge>
              </div>
            </div>
          </article>

          {/* Assignments */}
          <article className="card-surface p-5 md:col-span-3">
            <Header icon={ClipboardList} title="Assignments and deadlines" />
            <div className="mt-4 space-y-2">
              {[
                ["DBMS project", "High", "Fri"],
                ["Networks quiz", "Medium", "Mon"],
                ["OS lab report", "Low", "Wed"],
              ].map(([title, priority, due]) => (
                <div
                  key={title}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                >
                  <span className="font-medium text-foreground">{title}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        priority === "High"
                          ? "error"
                          : priority === "Medium"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {priority}
                    </Badge>
                    <span className="text-xs text-muted">{due}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Notes */}
          <article className="card-surface p-5 md:col-span-3">
            <Header icon={StickyNote} title="Smart notes" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                ["OSI model", "Networks"],
                ["Process scheduling", "OS"],
                ["SQL joins", "DBMS"],
                ["Routing notes", "Networks"],
              ].map(([title, subject]) => (
                <div
                  key={title}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-xs text-muted">{subject}</p>
                </div>
              ))}
            </div>
          </article>

          {/* Timetable */}
          <article className="card-surface p-5 md:col-span-2">
            <Header icon={CalendarDays} title="Timetable & attendance" />
            <div className="mt-4 grid grid-cols-5 gap-1.5 text-center text-[0.65rem]">
              {["M", "T", "W", "T", "F"].map((d, i) => (
                <div
                  key={`${d}-${i}`}
                  className={`rounded-md border px-1 py-2 ${
                    i === 2
                      ? "border-primary/30 bg-primary-soft font-semibold text-primary"
                      : "border-border text-secondary"
                  }`}
                >
                  {d}
                  <div className="mt-1 h-8 rounded bg-border/70" />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Attendance average · 86%</p>
          </article>

          {/* Exam prep */}
          <article className="card-surface p-5 md:col-span-2">
            <Header icon={GraduationCap} title="Exam preparation" />
            <div className="mt-4 rounded-lg border border-border bg-background p-3">
              <p className="text-sm font-semibold text-foreground">
                Networks midterm
              </p>
              <p className="mt-1 text-xs text-secondary">12 Aug · Focus: routing</p>
              <ProgressBar value={58} className="mt-3" label="Prep progress" />
            </div>
          </article>

          {/* Progress */}
          <article className="card-surface p-5 md:col-span-2">
            <Header icon={Target} title="Progress tracking" />
            <div className="mt-4 flex h-20 items-end gap-1.5">
              {[35, 48, 42, 60, 55, 72, 68, 80].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t-sm bg-primary/75"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Weekly study consistency</p>
          </article>

          {/* Subjects */}
          <article className="card-surface p-5 md:col-span-3">
            <Header icon={BookOpen} title="Subjects and courses" />
            <div className="mt-4 space-y-2.5">
              <ProgressBar value={78} label="Computer Networks" />
              <ProgressBar value={64} label="Operating Systems" tone="accent" />
              <ProgressBar value={71} label="Database Systems" tone="ai" />
            </div>
          </article>

          {/* Expenses */}
          <article className="card-surface p-5 md:col-span-3">
            <Header icon={Wallet} title="Student expenses" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ["Budget", "₹5,000"],
                ["Left", "₹1,350"],
                ["Safe/day", "₹122"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-border bg-background px-2.5 py-3 text-center"
                >
                  <p className="text-[0.65rem] text-muted">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function Header({
  icon: Icon,
  title,
  tone = "primary",
}: {
  icon: typeof Brain;
  title: string;
  tone?: "primary" | "ai";
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
          tone === "ai" ? "bg-ai-soft text-ai" : "bg-primary-soft text-primary"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function Bubble({
  children,
  mine = false,
}: {
  children: ReactNode;
  mine?: boolean;
}) {
  return (
    <div
      className={`max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
        mine
          ? "ml-auto bg-ai text-white"
          : "border border-border bg-surface text-foreground"
      }`}
    >
      {children}
    </div>
  );
}
