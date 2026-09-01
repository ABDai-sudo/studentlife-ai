import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function CanIAffordIt() {
  return (
    <section id="afford" className="section-y border-b border-border bg-surface">
      <div className="container-shell grid items-center gap-10 lg:grid-cols-2">
        <SectionHeader
          eyebrow="Can I Afford It?"
          title="Check a purchase against money left and remaining days"
          description="See the impact on your safe daily budget and savings goals before you spend. Example preview only — not a guarantee."
        />

        <div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              ["Item", "Running shoes"],
              ["Price", "₹500"],
              ["Money left", "₹1,350"],
              ["Days left", "11"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="warning">Affordable with caution</Badge>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-secondary">
              <li>• New safe daily budget ≈ ₹77 (was ₹122)</li>
              <li>• Laptop savings slows by ~1 week</li>
              <li>• Better timeline: wait for next pocket money cycle</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
