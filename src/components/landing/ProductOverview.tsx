import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductWindow } from "@/components/landing/ProductWindow";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function ProductOverview() {
  return (
    <section id="product" className="section-y border-b border-border bg-surface">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Financial dashboard"
          title="See money left, safe daily spend, and goals in one place"
          description="Example preview of the Money Dashboard students use to survive the month. Sample figures only."
          className="mb-10"
        />

        <ProductWindow title="StudentLife AI · Money Dashboard">
          <div className="grid min-h-[400px] bg-background lg:grid-cols-[200px_1fr]">
            <aside className="hidden border-r border-border bg-surface p-3 lg:block">
              <p className="px-2 pb-2 text-[0.65rem] font-semibold text-muted">
                FINANCE
              </p>
              {[
                "Money Dashboard",
                "Expenses",
                "Budget",
                "AI Money Coach",
                "Savings Goals",
                "Can I Afford It?",
              ].map((item, i) => (
                <div
                  key={item}
                  className={`rounded-lg px-2.5 py-2 text-sm ${
                    i === 0
                      ? "bg-primary-soft font-semibold text-primary"
                      : "text-secondary"
                  }`}
                >
                  {item}
                </div>
              ))}
              <p className="mt-4 px-2 pb-2 text-[0.65rem] font-semibold text-muted">
                STUDIES
              </p>
              {["Subjects", "Notes", "Assignments"].map((item) => (
                <div key={item} className="rounded-lg px-2.5 py-2 text-sm text-secondary">
                  {item}
                </div>
              ))}
            </aside>

            <div className="p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Money left this month
                  </p>
                  <p className="text-sm text-muted">11 days remaining · sample data</p>
                </div>
                <Badge tone="warning">Caution risk</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ["Money left", "₹1,350"],
                  ["Safe / day", "₹122"],
                  ["Spent", "₹4,050"],
                  ["Saved", "₹800"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border bg-surface p-3"
                  >
                    <p className="text-xs text-muted">{label}</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="mb-3 text-sm font-semibold">Category budgets</p>
                  <ProgressBar value={78} label="Food" className="mb-2.5" />
                  <ProgressBar value={54} label="Travel" className="mb-2.5" tone="accent" />
                  <ProgressBar value={40} label="Education" tone="ai" />
                </div>
                <div className="rounded-xl border border-ai/20 bg-ai-soft/50 p-4">
                  <p className="mb-2 text-sm font-semibold">AI Money Coach</p>
                  <p className="text-sm leading-relaxed text-secondary">
                    Food is up 31% vs last month. Cap cafeteria spend at ₹40/day
                    to keep your ₹122 safe daily limit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ProductWindow>
      </div>
    </section>
  );
}
