import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";

const goals = [
  {
    title: "New laptop",
    target: "₹60,000",
    current: "₹8,000",
    weekly: "₹750 / week",
    eta: "Est. Mar 2027",
    tip: "Save ₹50 more daily to finish ~18 days earlier.",
    value: 13,
  },
  {
    title: "Course fees",
    target: "₹15,000",
    current: "₹4,200",
    weekly: "₹400 / week",
    eta: "Est. Nov 2026",
    tip: "On track if entertainment stays under ₹500/week.",
    value: 28,
  },
  {
    title: "Emergency fund",
    target: "₹5,000",
    current: "₹3,200",
    weekly: "₹200 / week",
    eta: "Est. Sep 2026",
    tip: "Keep ₹100/week untouched after fixed costs.",
    value: 64,
  },
  {
    title: "Campus trip",
    target: "₹8,000",
    current: "₹1,500",
    weekly: "₹350 / week",
    eta: "Est. Dec 2026",
    tip: "Pause shopping weeks to protect this goal.",
    value: 19,
  },
];

export function SavingsGoals() {
  return (
    <section id="goals" className="section-y border-b border-border bg-background">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Savings & dream goals"
          title="Save for a laptop, course, phone, trip, or emergency buffer"
          description="Each goal shows target, progress, weekly contribution, and a practical coach tip."
          className="mb-10"
        />
        <div className="grid gap-8 md:grid-cols-2">
          {goals.map((goal) => (
            <article key={goal.title} className="border-t border-border pt-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  {goal.title}
                </h3>
                <span className="text-xs font-medium text-muted">{goal.eta}</span>
              </div>
              <p className="mt-2 text-sm text-secondary">
                {goal.current} of {goal.target} · {goal.weekly}
              </p>
              <ProgressBar value={goal.value} className="mt-3" />
              <p className="mt-3 text-xs leading-relaxed text-secondary">
                Tip: {goal.tip}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
