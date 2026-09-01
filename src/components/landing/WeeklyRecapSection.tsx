import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

const stats = [
  { label: "Tasks completed", value: "18" },
  { label: "Study time", value: "9.5 h" },
  { label: "Quiz score", value: "86%" },
  { label: "Current streak", value: "7 days" },
  { label: "Academic Aura", value: "82" },
  { label: "Money saved", value: "₹800" },
];

export function WeeklyRecapSection() {
  return (
    <section id="recap" className="section-y-compact border-b border-border bg-surface">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Weekly Recap"
          title="Shareable cards for your week in review"
          description="Export a clean weekly summary for stories or posts — study, streaks, aura, and money saved in one frame."
          className="mb-8"
        />

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_0.72fr]">
          <article
            className="card-elevated aspect-square max-w-md p-6"
            aria-label="Square weekly recap preview"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted">StudentLife AI</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                    My week in review
                  </h3>
                </div>
                <Badge tone="primary">Square</Badge>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-[0.65rem] text-muted">{stat.label}</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-auto border-t border-border pt-3">
                <p className="text-xs font-semibold text-foreground">
                  Achievement unlocked
                </p>
                <p className="mt-0.5 text-sm text-foreground">
                  On schedule · 7-day streak
                </p>
              </div>
            </div>
          </article>

          <article
            className="card-elevated mx-auto aspect-[9/16] w-full max-w-[240px] p-5"
            aria-label="Story weekly recap preview"
          >
            <div className="flex h-full flex-col">
              <Badge tone="primary" className="w-fit">
                9:16 Story
              </Badge>
              <h3 className="mt-4 text-lg font-semibold leading-snug text-foreground">
                My week in review
              </h3>
              <div className="mt-6 space-y-3">
                {stats.slice(0, 4).map((stat) => (
                  <div key={stat.label} className="border-b border-border pb-2">
                    <p className="text-[0.65rem] text-muted">{stat.label}</p>
                    <p className="text-base font-semibold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-auto text-xs font-medium text-secondary">
                Aura 82 · Saved ₹800 · Streak intact
              </p>
            </div>
          </article>
        </div>

        <div className="mt-6">
          <Button href="/signup" variant="secondary">
            Create my weekly recap
          </Button>
        </div>
      </div>
    </section>
  );
}
