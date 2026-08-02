import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function SafeDailySpending() {
  return (
    <section id="safe-spend" className="section-y border-b border-border bg-surface">
      <div className="container-shell grid items-center gap-10 lg:grid-cols-2">
        <SectionHeader
          eyebrow="Safe daily spending"
          title="Know what you can spend today without running out early"
          description="Safe per day = money available after fixed costs, divided across remaining days. This is budgeting guidance from your entries — not financial advice."
        />

        <div className="card-elevated p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Money left", "₹1,350"],
              ["Days remaining", "11"],
              ["Fixed upcoming costs", "₹200"],
              ["Safe amount / day", "₹122"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-background p-3"
              >
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="success">Safe</Badge>
            <Badge tone="warning">Caution</Badge>
            <Badge tone="error">High risk</Badge>
          </div>
          <p className="mt-3 text-sm text-secondary">
            Current example status: <strong className="text-warning">Caution</strong> —
            food spend is trending above plan.
          </p>
        </div>
      </div>
    </section>
  );
}
