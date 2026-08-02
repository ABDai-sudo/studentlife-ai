import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function FinancialHealthScore() {
  return (
    <section id="health" className="section-y border-b border-border bg-surface">
      <div className="container-shell grid items-center gap-10 lg:grid-cols-2">
        <SectionHeader
          eyebrow="Financial health score"
          title="A clear 0–100 budgeting score for your month"
          description="Based on budget adherence, savings rate, expense consistency, goal progress, emergency buffer, and overspending frequency. This is an internal budgeting score — not a credit score."
        />

        <div className="card-elevated p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Example score</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">
                84<span className="text-lg text-muted"> / 100</span>
              </p>
            </div>
            <Badge tone="success">Strong month</Badge>
          </div>
          <div className="mt-5 space-y-3">
            <ProgressBar value={88} label="Budget adherence" />
            <ProgressBar value={16} label="Savings rate" tone="accent" />
            <ProgressBar value={74} label="Expense consistency" />
            <ProgressBar value={42} label="Goal progress" tone="ai" />
            <ProgressBar value={64} label="Emergency buffer" tone="success" />
          </div>
        </div>
      </div>
    </section>
  );
}
