import { Brain } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";
import { Button } from "@/components/ui/Button";

export default function AiCoachPage() {
  return (
    <ModulePage
      title="AI Money Coach"
      subtitle="Ask about spending, goals, and daily limits"
      icon={Brain}
      emptyTitle="Ask a money question"
      emptyDescription="Example: I have ₹1,350 left and 11 days. Can I spend ₹500 on shoes?"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 rounded-xl border border-ai/20 bg-ai-soft/50 px-4 py-3 text-sm text-secondary">
          Budgeting guidance based on numbers you enter — not credit, banking, or
          investment advice.
        </div>
        <div className="card-surface overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">AI Money Coach</p>
            <p className="text-xs text-muted">Student spending help</p>
          </div>
          <div className="space-y-3 px-4 py-5">
            <div className="ml-auto max-w-[88%] rounded-xl bg-ai px-3.5 py-2.5 text-sm text-white">
              Where did I overspend this month?
            </div>
            <div className="max-w-[90%] rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground">
              Log a few expenses first. Then the coach can compare food, travel,
              and entertainment against your plan.
            </div>
          </div>
          <div className="border-t border-border px-4 py-3">
            <div className="flex gap-2">
              <input
                className="field-input"
                placeholder="Ask about your budget…"
                disabled
                aria-label="Money coach message"
              />
              <Button type="button" variant="ai" disabled>
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
