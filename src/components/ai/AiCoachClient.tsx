"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  getMoneyAssistantCopy,
  moneyAssistantQuickActions,
  seriousCopy,
} from "@/lib/personality";

type Msg = {
  role: "user" | "assistant";
  text: string;
  outOfScope?: boolean;
};

const SUGGESTIONS = [
  "Where did I overspend this month?",
  "What is my safe daily spend?",
  "Can I spend 500 on shoes?",
  "Help me protect my savings goal",
];

export function AiCoachClient() {
  const router = useRouter();
  const { personality } = useTheme();
  const assistant = useMemo(
    () => getMoneyAssistantCopy(personality),
    [personality]
  );

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: assistant.welcome },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScopeActions, setShowScopeActions] = useState(false);

  // Keep the welcome line in sync when personality changes (fresh chat only).
  const [seenWelcome, setSeenWelcome] = useState(assistant.welcome);
  if (assistant.welcome !== seenWelcome) {
    setSeenWelcome(assistant.welcome);
    if (messages.length === 1 && messages[0]?.role === "assistant") {
      setMessages([{ role: "assistant", text: assistant.welcome }]);
    }
  }

  async function ask(message: string) {
    if (!message.trim() || loading) return;
    setError(null);
    setShowScopeActions(false);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: message.trim() }]);
    setInput("");
    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || seriousCopy.errorGeneric);
        return;
      }
      const outOfScope = Boolean(json.data?.outOfScope);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: json.data.reply,
          outOfScope,
        },
      ]);
      setShowScopeActions(outOfScope);
    } catch {
      setError(seriousCopy.errorNetwork);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  function onQuickAction(action: (typeof moneyAssistantQuickActions)[number]) {
    if (action.href) {
      router.push(action.href);
      return;
    }
    if (action.prompt) void ask(action.prompt);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden border-t border-border">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground sm:text-[0.95rem]">
                {assistant.name}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted sm:text-[0.8125rem]">
                {assistant.tagline}
              </p>
            </div>
            <details className="relative shrink-0">
              <summary
                className="cursor-pointer list-none rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface-secondary hover:text-foreground"
                aria-label="About this assistant"
              >
                Info
              </summary>
              <p className="absolute right-0 z-10 mt-1 w-[min(18rem,calc(100vw-2.5rem))] rounded-xl border border-border bg-surface p-3 text-xs leading-relaxed text-secondary shadow-md">
                {seriousCopy.moneyAssistantLimitation}
              </p>
            </details>
          </div>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-secondary sm:text-sm">
            {assistant.subtitle}
          </p>
        </div>

        <div className="max-h-[420px] space-y-3 overflow-y-auto px-4 py-5 sm:px-5">
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[88%] rounded-xl bg-primary px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words text-white"
                  : "max-w-[92%] rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground"
              }
            >
              {m.text}
            </div>
          ))}

          {showScopeActions ? (
            <div className="rounded-xl border border-dashed border-border bg-surface-secondary/50 px-3 py-3">
              <p className="mb-2 text-xs font-medium text-secondary">
                Try one of these instead
              </p>
              <div className="flex flex-wrap gap-2">
                {moneyAssistantQuickActions.map((action) =>
                  action.href ? (
                    <Link
                      key={action.id}
                      href={action.href}
                      className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs leading-snug text-secondary hover:bg-surface-secondary hover:text-foreground"
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <button
                      key={action.id}
                      type="button"
                      className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs leading-snug text-secondary hover:bg-surface-secondary hover:text-foreground disabled:opacity-50"
                      onClick={() => onQuickAction(action)}
                      disabled={loading}
                    >
                      {action.label}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : null}
        </div>

        {!showScopeActions ? (
          <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3 sm:px-5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="max-w-full rounded-md border border-border px-3 py-1 text-xs leading-snug break-words text-secondary hover:bg-surface-secondary disabled:opacity-50"
                onClick={() => void ask(s)}
                disabled={loading}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="border-t border-error/25 bg-error-soft px-4 py-2 text-sm text-error">
            {error}
          </div>
        ) : null}

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:px-5"
        >
          <input
            className="field-input min-w-0 flex-1"
            placeholder={`Message ${assistant.name}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label={`${assistant.name} message`}
            disabled={loading}
          />
          <Button
            type="submit"
            variant="primary"
            className="shrink-0 sm:w-auto"
            disabled={loading || !input.trim()}
          >
            {loading ? "…" : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}
