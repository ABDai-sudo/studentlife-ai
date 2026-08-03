"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type Msg = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Explain this topic in simple words",
  "Make a 5-day study plan for my exam",
  "Help me prioritize my homework",
  "Give me practice questions",
];

export function AiTutorClient() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Ask a study question in simple words. I can explain topics, make a study plan, or help with homework priorities.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(message: string) {
    if (!message.trim() || loading) return;
    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: message.trim() }]);
    setInput("");
    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Tutor could not reply.");
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: json.data.reply },
      ]);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 rounded-xl border border-border bg-surface-secondary/60 px-4 py-3 text-sm text-secondary">
        Study help based on your classes and homework. Always double-check with your course materials.
      </div>
      <div className="card-surface overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Study Tutor</p>
          <p className="text-xs text-muted">Explanations, plans, and homework help</p>
        </div>
        <div className="max-h-[420px] space-y-3 overflow-y-auto px-4 py-5">
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[88%] rounded-xl bg-ai px-3.5 py-2.5 text-sm whitespace-pre-wrap text-white"
                  : "max-w-[90%] rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm whitespace-pre-wrap text-foreground"
              }
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="rounded-full border border-border px-3 py-1 text-xs text-secondary hover:bg-surface-secondary"
              onClick={() => void ask(s)}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>
        {error ? (
          <div className="border-t border-error/20 bg-red-50 px-4 py-2 text-sm text-error">
            {error}
          </div>
        ) : null}
        <form onSubmit={onSubmit} className="flex gap-2 border-t border-border px-4 py-3">
          <input
            className="field-input"
            placeholder="Ask a study question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" variant="ai" disabled={loading || !input.trim()}>
            {loading ? "…" : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}
