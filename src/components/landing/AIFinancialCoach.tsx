import { Copy, RefreshCw, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

const prompts = [
  "Where did I overspend this month?",
  "Create a savings plan for a ₹25,000 laptop.",
  "How much can I spend this weekend?",
  "Help me reduce food expenses.",
  "Can I afford this purchase?",
  "Create a monthly student budget.",
];

export function AIFinancialCoach() {
  return (
    <section id="coach" className="section-y border-b border-border bg-background">
      <div className="container-shell grid items-center gap-10 lg:grid-cols-2">
        <div>
          <SectionHeader
            eyebrow="AI Money Coach"
            title="Practical money guidance for real student decisions"
            description="Ask about spending, goals, and daily limits in plain language. This is budgeting guidance from your entries — not banking, credit, or investment advice."
          />
          <ul className="mt-6 space-y-2.5">
            {[
              "Check if a purchase fits your remaining days",
              "Find where you overspent this month",
              "Build a weekly savings plan for a goal",
            ].map((item) => (
              <li key={item} className="flex gap-2 text-sm text-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <Button href="/signup">
              Try Money Coach
            </Button>
          </div>
        </div>

        <div className="overflow-hidden border-t border-border">
          <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Money Coach</p>
              <p className="text-xs text-muted">Example conversation · sample data</p>
            </div>
            <Badge tone="primary">Coach</Badge>
          </div>

          <div className="space-y-3 bg-background px-4 py-4">
            <div className="ml-auto max-w-[90%] rounded-xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm text-white">
              I have ₹1,350 left and 11 days remaining. Can I spend ₹500 on shoes?
            </div>
            <div className="max-w-[94%] rounded-2xl rounded-bl-md border border-border bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
              You can buy them, but your safe daily budget would fall from ₹122 to
              about ₹77. Waiting until next month would keep your food and travel
              budget safer.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-secondary"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-secondary"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {prompts.slice(0, 4).map((prompt) => (
                <span
                  key={prompt}
                  className="rounded-md border border-border bg-surface-secondary px-2.5 py-1 text-[0.7rem] text-secondary"
                >
                  {prompt}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
              <span className="flex-1 text-sm text-muted">Ask about your budget…</span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <Send className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
