import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function AcademicHub() {
  return (
    <section id="academics" className="section-y border-b border-border bg-surface">
      <div className="container-shell">
        <SectionHeader
          eyebrow="StudentLife Hub"
          title="Money and academics, organized together"
          description="Academic tools stay available as a supporting workspace — never replacing your financial dashboard."
          className="mb-10"
        />

        <div className="card-elevated p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              Compact academic module
            </p>
            <Badge tone="neutral">Secondary to Money Dashboard</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Mini title="Next class" body="Algorithms · 10:00 · Room 204" />
            <Mini title="Assignment due" body="DBMS project · Friday" />
            <Mini title="Upcoming exam" body="Networks midterm · 12 Aug" />
            <Mini title="Attendance" body="86% average · above 75%" />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="mb-3 text-sm font-semibold">Study progress</p>
              <ProgressBar value={72} label="Semester average" />
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="mb-2 text-sm font-semibold">AI study assistant</p>
              <p className="text-sm text-secondary">
                Optional help for explanations and revision plans — available after
                your money tools on the sidebar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Mini({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted">{title}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{body}</p>
    </div>
  );
}
