import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function PocketMoneyMode() {
  return (
    <section id="pocket-money" className="section-y border-b border-border bg-surface">
      <div className="container-shell grid items-center gap-10 lg:grid-cols-2">
        <SectionHeader
          eyebrow="Pocket Money Mode"
          title="Tell the app how much money you have — and how long it must last"
          description="StudentLife AI calculates a safe daily budget and updates it after every expense you log. Guidance only — based on numbers you enter."
        />

        <div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              ["Monthly pocket money", "₹5,000"],
              ["Part-time / scholarship", "₹1,200"],
              ["Hostel or day scholar", "Hostel"],
              ["Fixed monthly costs", "₹2,400"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-primary">Expected plan</p>
                <p className="mt-1 text-sm text-secondary">
                  Variable spend ₹2,800 · Expected savings ₹800
                </p>
              </div>
              <p className="text-2xl font-semibold text-foreground">₹122/day</p>
            </div>
            <ProgressBar value={62} className="mt-4" label="Month used" />
          </div>
        </div>
      </div>
    </section>
  );
}
