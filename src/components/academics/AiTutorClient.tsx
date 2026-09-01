"use client";

import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SafeMarkdown } from "@/components/ui/SafeMarkdown";
import { useTheme } from "@/components/theme/ThemeProvider";
import { getCopy } from "@/lib/personality";
import { mountFetch } from "@/lib/react/mount-fetch";
import { useT } from "@/components/i18n/LocaleProvider";

type Msg = { id?: string; role: "user" | "assistant"; text: string };
type Convo = { id: string; title: string; updatedAt: string };

const ACTION_DEFS = [
  { labelKey: "tutor.askAnything" as const, prompt: "Help me understand this topic: " },
  { labelKey: "tutor.helpAssignment" as const, prompt: "Help me plan this assignment: " },
  { labelKey: "tutor.explainNotes" as const, prompt: "Explain these notes simply: " },
  { labelKey: "tutor.generatePaper" as const, prompt: "Create practice questions on: " },
  { labelKey: "tutor.testMe" as const, prompt: "Test me with 5 questions on: " },
  { labelKey: "tutor.examEmergency" as const, href: "/dashboard/emergency" },
  { labelKey: "tutor.studyPlan" as const, prompt: "Create a realistic study plan for: " },
  { labelKey: "tutor.simplify" as const, prompt: "Simplify this topic: " },
  { labelKey: "tutor.viva" as const, prompt: "Generate viva questions on: " },
] as const;

const QUICK_DEFS = [
  { mode: "explain_simply", labelKey: "tutor.explainSimply" as const },
  { mode: "explain_detail", labelKey: "tutor.explainDetail" as const },
  { mode: "exam_ready", labelKey: "tutor.examReady" as const },
  { mode: "example", labelKey: "tutor.giveExample" as const },
  { mode: "diagram", labelKey: "tutor.showDiagram" as const },
  { mode: "notes", labelKey: "tutor.createNotes" as const },
  { mode: "test_me", labelKey: "tutor.testMe" as const },
  { mode: "flashcards", labelKey: "tutor.flashcards" as const },
  { mode: "translate", labelKey: "tutor.translate" as const },
  { mode: "continue", labelKey: "tutor.continue" as const },
] as const;

export function AiTutorClient() {
  const { personality } = useTheme();
  const { t, locale } = useT();
  const copy = getCopy(personality);
  const emptyConversations =
    locale === "en"
      ? copy.emptyStates.noConversations
      : t("empty.noConversationsBody");
  const tutorGreeting =
    locale === "en" ? copy.greetings.tutorHome : t("tutor.subtitle");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [convos, setConvos] = useState<Convo[]>([]);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadConvos = useCallback(async () => {
    const res = await fetch(
      `/api/ai/conversations${search ? `?q=${encodeURIComponent(search)}` : ""}`,
      { cache: "no-store" }
    );
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) setConvos(json.data);
  }, [search]);

  useEffect(() => {
    const url = `/api/ai/conversations${search ? `?q=${encodeURIComponent(search)}` : ""}`;
    return mountFetch(url, ({ ok, json }) => {
      const body = json as { success?: boolean; data?: Convo[] } | null;
      if (ok && body?.success) setConvos(body.data!);
    });
  }, [search]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function openConvo(id: string) {
    setError(null);
    const res = await fetch(`/api/ai/conversations/${id}`, { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not open conversation.");
      return;
    }
    setConversationId(id);
    setMessages(
      json.data.messages.map(
        (m: { id: string; role: string; content: string }) => ({
          id: m.id,
          role: m.role === "USER" ? "user" : "assistant",
          text: m.content,
        })
      )
    );
  }

  async function newChat() {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }

  async function ask(message: string, mode = "default") {
    if (!message.trim() || loading) return;
    setError(null);
    setLoading(true);
    const userText = message.trim();
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          conversationId: conversationId || undefined,
          mode,
          stream: false,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(
          json?.error?.message ||
            `Tutor could not reply (${res.status}). Check you are signed in.`
        );
        return;
      }

      if (json.data.conversationId) {
        setConversationId(json.data.conversationId);
      }

      const reply =
        typeof json.data.reply === "string" && json.data.reply.trim()
          ? json.data.reply
          : "I could not generate a reply. Please try again.";

      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      void loadConvos();
    } catch {
      setError("Could not reach the server. Is npm run dev running?");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  const showHome = messages.length === 0 && !loading;

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="hidden h-fit border-e border-border pe-4 lg:block">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("tutor.conversations")}
          </p>
          <Button
            size="sm"
            variant="secondary"
            type="button"
            onClick={() => void newChat()}
          >
            {t("tutor.newChat")}
          </Button>
        </div>
        <input
          className="field-input mb-2 text-sm"
          placeholder={t("tutor.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t("tutor.search")}
        />
        <div className="max-h-[480px] space-y-1 overflow-y-auto">
          {convos.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted">
              {emptyConversations}
            </p>
          ) : (
            convos.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => void openConvo(c.id)}
                className={`w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-secondary ${
                  conversationId === c.id ? "bg-primary-soft text-primary" : ""
                }`}
              >
                <span className="line-clamp-2 font-medium">{c.title}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 border-s-2 border-border px-4 py-2 text-sm text-secondary">
          {tutorGreeting}
        </div>

        {showHome ? (
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {ACTION_DEFS.map((a) =>
              "href" in a && a.href ? (
                <Button
                  key={a.labelKey}
                  href={a.href}
                  variant="secondary"
                  className="justify-start"
                >
                  {t(a.labelKey)}
                </Button>
              ) : (
                <button
                  key={a.labelKey}
                  type="button"
                  className="border-t border-border py-3 text-left text-sm font-medium hover:text-primary"
                  onClick={() => {
                    if ("prompt" in a && a.prompt) {
                      setInput(a.prompt);
                    }
                  }}
                >
                  {t(a.labelKey)}
                </button>
              )
            )}
          </div>
        ) : null}

        <div className="overflow-hidden border border-border">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">{t("tutor.title")}</p>
            <p className="text-xs text-muted">{t("tutor.subtitle")}</p>
          </div>
          <div className="max-h-[480px] space-y-3 overflow-y-auto px-4 py-5">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[88%] rounded-xl bg-primary px-3.5 py-2.5 text-sm whitespace-pre-wrap text-white"
                    : "max-w-[92%] rounded-xl border border-border bg-background px-3.5 py-2.5"
                }
              >
                {m.role === "assistant" ? (
                  m.text ? (
                    <SafeMarkdown content={m.text} />
                  ) : loading ? (
                    <span className="text-muted">{t("tutor.thinking")}</span>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  )
                ) : (
                  <span className="whitespace-pre-wrap">{m.text}</span>
                )}
                {m.role === "assistant" && m.text ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="rounded-md border border-border px-2 py-0.5 text-[0.7rem]"
                      onClick={() => void navigator.clipboard.writeText(m.text)}
                    >
                      {t("tutor.copy")}
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-border px-2 py-0.5 text-[0.7rem]"
                      onClick={() => {
                        const prevUser = [...messages]
                          .slice(0, i)
                          .reverse()
                          .find((x) => x.role === "user");
                        if (prevUser) void ask(prevUser.text);
                      }}
                    >
                      {t("tutor.regenerate")}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {messages.some((m) => m.role === "assistant") ? (
            <div className="flex flex-wrap gap-1 border-t border-border px-3 py-2">
              {QUICK_DEFS.map((q) => (
                <button
                  key={q.mode}
                  type="button"
                  disabled={loading}
                  className="rounded-md border border-border px-2.5 py-1 text-[0.7rem] hover:bg-surface-secondary disabled:opacity-50"
                  onClick={() => void ask(`Apply mode: ${t(q.labelKey)}`, q.mode)}
                >
                  {t(q.labelKey)}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-2 border-t border-border p-3 sm:flex-row"
          >
            <textarea
              className="field-input min-h-[44px] flex-1 resize-y text-sm"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("tutor.placeholder")}
              aria-label="Message"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !input.trim()}
              >
                {loading ? t("loading.generic") : t("tutor.send")}
              </Button>
            </div>
          </form>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
