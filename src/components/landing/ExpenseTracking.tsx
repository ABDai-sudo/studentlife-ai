import { SectionHeader } from "@/components/ui/SectionHeader";

const categories = [
  ["Food", "₹1,420", "78%"],
  ["Travel", "₹680", "54%"],
  ["Education", "₹920", "40%"],
  ["Entertainment", "₹540", "61%"],
  ["Shopping", "₹310", "35%"],
  ["Other", "₹180", "22%"],
];

export function ExpenseTracking() {
  return (
    <section id="expenses" className="section-y border-b border-border bg-background">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Expense tracking"
          title="Log spends by category and see where the month went"
          description="Food, travel, education, entertainment, shopping, and more — with clear totals and recent transactions."
          className="mb-10"
        />

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 text-sm font-semibold text-foreground">
              Categories this month · sample
            </p>
            <div className="divide-y divide-border border-t border-border">
              {categories.map(([name, amount, used]) => (
                <div
                  key={name}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="font-medium text-foreground">{name}</span>
                  <span className="text-secondary">
                    {amount} · {used} of budget
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold text-foreground">
              Recent transactions
            </p>
            <div className="divide-y divide-border border-t border-border">
            {[
              ["Canteen lunch", "Today", "−₹120"],
              ["Auto to campus", "Yesterday", "−₹80"],
              ["Printed notes", "Mon", "−₹45"],
              ["Movie night", "Sun", "−₹250"],
            ].map(([name, when, amount]) => (
              <div
                key={name}
                className="flex items-center justify-between py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <p className="text-xs text-muted">{when}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{amount}</span>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
