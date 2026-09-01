import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function AcademicHub() {
  return (
    <section id="academics" className="section-y border-b border-border bg-surface">
      <div className="container-shell">
        <SectionHeader
          eyebrow="StudentLife Hub"
          title="Academics and money, organized together"
          description="Study tools and budget tools share one workspace, so neither has to live in a separate app."
          className="mb-10"
        />

        <div>
          <p className="text-sm font-semibold text-foreground">
            Academic snapshot
          </p>

          <div className="mt-4 grid gap-6 border-t border-border pt-5 md:grid-cols-2 xl:grid-cols-4">
            <Mini title="Next class" body="Algorithms · 10:00 · Room 204" />
            <Mini title="Assignment due" body="DBMS project · Friday" />
            <Mini title="Upcoming exam" body="Networks midterm · 12 Aug" />
            <Mini title="Attendance" body="86% average · above 75%" />
          </div>

          <div className="mt-8 grid gap-8 border-t border-border pt-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold">Study progress</p>
              <ProgressBar value={72} label="Semester average" />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Study assistant</p>
              <p className="text-sm text-secondary">
                Optional help for explanations and revision plans, available from
                the same sidebar as your money tools.
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
    <div>
      <p className="text-xs font-medium text-muted">{title}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{body}</p>
    </div>
  );
}
