import { Brain } from "lucide-react";
import { ModulePage } from "@/components/app/ModulePage";
import { Button } from "@/components/ui/Button";

export default function AiTutorPage() {
  return (
    <ModulePage
      title="Ask AI"
      subtitle="Type your question in simple words"
      icon={Brain}
      emptyTitle="Ask anything"
      emptyDescription="Example: Explain this chapter in easy words."
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 rounded-xl border border-ai/20 bg-ai-soft/50 px-4 py-3 text-sm text-secondary">
          Tip: Write like you talk. Example: “Please explain photosynthesis simply.”
        </div>
        <div className="card-surface overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Ask AI</p>
            <p className="text-xs text-muted">Help for your studies</p>
          </div>
          <div className="space-y-3 px-4 py-5">
            <div className="max-w-[85%] rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground">
              Try: “Explain the OSI model in simple language.”
            </div>
            <div className="ml-auto max-w-[85%] rounded-xl bg-ai px-3.5 py-2.5 text-sm text-white">
              Create a five-day study plan for my exam.
            </div>
          </div>
          <div className="border-t border-border px-4 py-3">
            <div className="flex gap-2">
              <input
                className="field-input"
                placeholder="Type your question here…"
                disabled
                aria-label="Ask AI message"
              />
              <Button type="button" variant="ai" disabled>
                Send
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted">
              Chat replies will connect in a later update. Your account is ready.
            </p>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
