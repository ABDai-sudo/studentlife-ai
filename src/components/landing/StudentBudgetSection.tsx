import { MessagesSquare, Target, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";

const categories = [
  ["Food", "₹1,420"],
  ["Travel", "₹680"],
  ["Education", "₹920"],
  ["Entertainment", "₹540"],
];

export function StudentBudgetSection() {
  return (
    <section id="budget" className="section-y-compact border-b border-border bg-background">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Student Budget Management"
          title="Make your money last without losing track of student life."
          description="Pocket money, safe daily spend, expenses, goals, affordability checks, and a Money Coach — one money module inside the larger academic workspace."
          className="mb-8"
        />

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="mb-3 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Money remaining</p>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-foreground">₹1,350</p>
            <p className="mt-1 text-sm text-secondary">of ₹5,000 this month · 11 days left</p>
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted">Safe spending per day</p>
              <p className="mt-1 text-2xl font-semibold text-success">₹122</p>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-muted">Financial health</span>
                <Badge tone="primary">84 / 100</Badge>
              </div>
              <ProgressBar value={84} label="Budget score" />
            </div>
          </div>

          <div className="border-t border-border pt-5 lg:col-span-4 lg:border-t-0 lg:border-s lg:ps-8">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Expenses by category
            </p>
            <div className="mb-4 flex h-14 items-end gap-1.5">
              {[72, 38, 52, 30].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t-sm bg-primary/80"
                  style={{ height: `${h}%` }}
                  aria-hidden
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {categories.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-1.5 text-xs"
                >
                  <span className="text-secondary">{label}</span>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold text-foreground">Can I Afford It?</p>
              <p className="mt-1 text-sm text-secondary">
                Headphones ₹2,499 · Not this week without cutting food by ₹90/day
              </p>
            </div>
          </div>

          <div className="space-y-8 border-t border-border pt-5 lg:col-span-4 lg:border-t-0 lg:border-s lg:ps-8">
            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">Savings goals</p>
              <ProgressBar value={42} label="Laptop · ₹8k / ₹60k" className="mb-2.5" />
              <ProgressBar
                value={65}
                label="Emergency fund · ₹3.2k / ₹5k"
                tone="success"
              />
            </div>
            <div className="border-t border-border pt-5">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <MessagesSquare className="h-4 w-4 text-primary" aria-hidden />
                Money Coach
              </div>
              <ul className="space-y-2 text-sm leading-relaxed text-secondary">
                <li>• Food is 31% higher than last month.</li>
                <li>• Cap cafeteria spend near ₹40/day to stay on plan.</li>
                <li>• ₹50/day toward the laptop goal accelerates progress.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button href="/signup">Open money tools</Button>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted">
            <Target className="h-3.5 w-3.5" aria-hidden />
            Example preview · sample data · budgeting guidance only
          </p>
        </div>
      </div>
    </section>
  );
}
