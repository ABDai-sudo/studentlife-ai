"use client";

import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  Compass,
  MessageSquare,
  NotebookPen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState, LoadingState } from "@/components/ui/ErrorState";
import { SafeMarkdown } from "@/components/ui/SafeMarkdown";
import { useT } from "@/components/i18n/LocaleProvider";
import { mountFetch } from "@/lib/react/mount-fetch";

type StudyNow = {
  title: string;
  subject: string | null;
  minutes: number;
  reason: string;
  fromDatabase: boolean;
  kind: string;
};

type PlanItem = {
  id: string;
  kind: string;
  title: string;
  subject: string | null;
  minutes: number;
  completed: boolean;
  fromDatabase: boolean;
  reason: string | null;
};

type Plan = {
  id: string;
  headline: string;
  summary: string;
  items: PlanItem[];
};

type Overview = {
  facts: {
    hasAcademicData: boolean;
    subjects: { id: string; name: string }[];
    pending: { id: string; title: string; dueDate: string }[];
    exams: { id: string; title: string; examDate: string; subject: string }[];
    notes: { id: string; title: string }[];
    todaySlots: { id: string; title: string; startTime: string }[];
    weakTopics: string[];
    explanationLang: string;
  };
  studyNow: StudyNow | null;
  todayPlan: Plan | null;
  openSession: {
    id: string;
    subject: string | null;
    taskTitle: string | null;
    plannedMinutes: number;
  } | null;
  progress: { xpTotal: number; level: number; streak: number };
  history: { id: string; planDate: string; headline: string }[];
  conversations: {
    id: string;
    title: string;
    pinned: boolean;
    messageCount: number;
  }[];
};

type ChatMsg = { id?: string; role: "user" | "assistant"; text: string };

async function postAction(body: Record<string, unknown>) {
  const res = await fetch("/api/study-buddy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { ok: res.ok, json };
}

export function StudyBuddyClient({
  initialData = null,
}: {
  initialData?: Overview | null;
}) {
  const { t } = useT();
  const [data, setData] = useState<Overview | null>(initialData);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const applyOverview = useCallback((next: Overview) => {
    setData(next);
    setLoadError(null);
  }, []);

  useEffect(() => {
    if (initialData) return;
    return mountFetch(
      "/api/study-buddy",
      ({ ok, json }) => {
        const body = json as { success?: boolean; data?: Overview; error?: { message?: string } } | null;
        if (ok && body?.success && body.data) applyOverview(body.data);
        else setLoadError(body?.error?.message || t("buddy.loadError"));
      },
      () => setLoadError(t("errors.network"))
    );
  }, [applyOverview, initialData, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function reload() {
    const res = await fetch("/api/study-buddy", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) applyOverview(json.data);
  }

  async function run(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    setActionError(null);
    try {
      const { ok, json } = await postAction({ action, ...extra });
      if (!ok || !json?.success) {
        setActionError(json?.error?.message || t("errors.generic"));
        return null;
      }
      await reload();
      return json.data;
    } catch {
      setActionError(t("errors.network"));
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function openHistory(id: string) {
    setActionError(null);
    const res = await fetch(`/api/study-buddy?conversationId=${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setActionError(json?.error?.message || t("buddy.loadError"));
      return;
    }
    setConversationId(id);
    setMessages(
      (json.data.messages as { id: string; role: string; content: string }[]).map(
        (m) => ({
          id: m.id,
          role: m.role === "USER" ? "user" : "assistant",
          text: m.content,
        })
      )
    );
  }

  async function onChat(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setBusy("chat");
    setActionError(null);
    try {
      const { ok, json } = await postAction({
        action: "chat",
        message: text,
        conversationId: conversationId || undefined,
      });
      if (!ok || !json?.success) {
        setActionError(json?.error?.message || t("buddy.chatError"));
        return;
      }
      setConversationId(json.data.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: json.data.reply },
      ]);
      await reload();
    } catch {
      setActionError(t("errors.network"));
    } finally {
      setBusy(null);
    }
  }

  if (!data && !loadError) {
    return <LoadingState label={t("loading.generic")} />;
  }
  if (loadError && !data) {
    return (
      <ErrorState
        title={t("buddy.loadError")}
        message={loadError}
        onRetry={() => window.location.reload()}
        retryLabel={t("actions.retry")}
      />
    );
  }
  if (!data) return null;

  const completing = busy !== null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-8">
      {actionError ? (
        <ErrorState title={t("errors.generic")} message={actionError} />
      ) : null}

      <div className="flex min-w-0 flex-wrap gap-4 text-sm text-secondary">
        <span>
          {t("buddy.streak")} · {data.progress.streak}
        </span>
        <span>
          {t("dashboard.xp")} · {data.progress.xpTotal}
        </span>
        <span>
          {t("buddy.deadlines")} · {data.facts.pending.length}
        </span>
        <span>
          {t("buddy.exams")} · {data.facts.exams.length}
        </span>
      </div>

      {!data.facts.hasAcademicData ? (
        <EmptyState
          icon={Compass}
          title={t("buddy.emptyTitle")}
          description={t("buddy.emptyBody")}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button href="/dashboard/subjects" size="sm" variant="secondary">
                {t("buddy.addSubjects")}
              </Button>
              <Button href="/dashboard/assignments" size="sm" variant="secondary">
                {t("buddy.addAssignments")}
              </Button>
              <Button href="/dashboard/exams" size="sm" variant="secondary">
                {t("buddy.addExams")}
              </Button>
            </div>
          }
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">{t("buddy.studyNow")}</h2>
        {data.studyNow ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={data.studyNow.fromDatabase ? "primary" : "neutral"}>
                {data.studyNow.fromDatabase ? t("buddy.fact") : t("buddy.suggestion")}
              </Badge>
              {data.studyNow.subject ? (
                <span className="text-sm text-muted">{data.studyNow.subject}</span>
              ) : null}
              <span className="text-sm text-muted">
                {t("buddy.minutes", { n: data.studyNow.minutes })}
              </span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {data.studyNow.title}
            </p>
            <p className="text-sm text-secondary">{data.studyNow.reason}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={completing}
                onClick={() => void run("generate_session")}
              >
                {t("buddy.startSession")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={completing}
                onClick={() => void run("quick_revision")}
              >
                {t("buddy.quickRevision")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-secondary">{t("buddy.studyNowEmpty")}</p>
        )}
        {data.openSession ? (
          <div className="border-t border-border pt-3">
            <p className="text-sm font-medium">{t("buddy.openSession")}</p>
            <p className="mt-1 text-sm text-secondary">
              {data.openSession.taskTitle || data.openSession.subject} ·{" "}
              {t("buddy.minutes", { n: data.openSession.plannedMinutes })}
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-2"
              variant="secondary"
              disabled={completing}
              onClick={() => void run("complete_session")}
            >
              {t("buddy.completeSession")}
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">{t("buddy.todaysPlan")}</h2>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={completing}
            onClick={() => void run("generate_plan")}
          >
            {data.todayPlan ? t("buddy.regeneratePlan") : t("buddy.generatePlan")}
          </Button>
        </div>
        {busy === "generate_plan" ? (
          <p className="text-sm text-muted">{t("buddy.generating")}</p>
        ) : null}
        {data.todayPlan ? (
          <>
            <p className="break-words text-sm font-medium text-foreground">
              {data.todayPlan.headline}
            </p>
            <p className="break-words text-sm text-secondary">{data.todayPlan.summary}</p>
            {data.todayPlan.items.length ? (
              <ul className="divide-y divide-border">
                {data.todayPlan.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                  >
                    <div className="min-w-0">
                      <p
                        className={`break-words font-medium ${item.completed ? "text-muted line-through" : "text-foreground"}`}
                      >
                        {item.title}
                      </p>
                      <p className="mt-1 break-words text-xs text-muted">
                        <Badge
                          tone={item.fromDatabase ? "primary" : "neutral"}
                          className="me-2"
                        >
                          {item.fromDatabase ? t("buddy.fact") : t("buddy.suggestion")}
                        </Badge>
                        {t("buddy.minutes", { n: item.minutes })}
                        {item.reason ? ` · ${item.reason}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={item.completed ? "ghost" : "secondary"}
                      disabled={completing || item.completed}
                      onClick={() => void run("complete_item", { itemId: item.id })}
                      className="w-full shrink-0 sm:w-auto"
                    >
                      {item.completed ? (
                        <>
                          <Check className="h-4 w-4" aria-hidden />
                          {t("buddy.done")}
                        </>
                      ) : (
                        t("buddy.markDone")
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-secondary">{t("buddy.noPlan")}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-secondary">{t("buddy.noPlan")}</p>
        )}
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-base font-semibold">{t("buddy.weakTopics")}</h2>
        {data.facts.weakTopics.length ? (
          <ul className="flex flex-wrap gap-2">
            {data.facts.weakTopics.map((topic) => (
              <li key={topic}>
                <Badge>{topic}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-secondary">{t("buddy.weakEmpty")}</p>
        )}
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
          {t("buddy.timetableToday")}
        </h2>
        {data.facts.todaySlots.length ? (
          <ul className="divide-y divide-border text-sm">
            {data.facts.todaySlots.map((slot) => (
              <li key={slot.id} className="py-2">
                <span className="font-medium">{slot.title}</span>
                <span className="ms-2 text-muted">{slot.startTime}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-secondary">{t("buddy.noTimetable")}</p>
        )}
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
            {t("buddy.ask")}
          </h2>
          {conversationId ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={completing}
              onClick={() => void run("save_chat", { conversationId })}
            >
              {t("buddy.saveChat")}
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted">
          {t("buddy.explainLang", { lang: data.facts.explanationLang })}
        </p>
        <div className="max-h-80 space-y-3 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-secondary">{t("buddy.noChatYet")}</p>
          ) : (
            messages.map((m, i) => (
              <div key={m.id ?? `${m.role}-${i}`} className="text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {m.role === "user" ? t("buddy.you") : t("buddy.title")}
                </p>
                {m.role === "assistant" ? (
                  <SafeMarkdown content={m.text} />
                ) : (
                  <p className="mt-1 text-foreground">{m.text}</p>
                )}
              </div>
            ))
          )}
          {busy === "chat" ? (
            <p className="text-sm text-muted">{t("loading.generic")}</p>
          ) : null}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={(e) => void onChat(e)} className="flex w-full min-w-0 flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="buddy-chat">
            {t("buddy.placeholder")}
          </label>
          <input
            id="buddy-chat"
            className="field-input min-w-0 flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("buddy.placeholder")}
            maxLength={4000}
            disabled={busy === "chat"}
          />
          <Button type="submit" disabled={!input.trim() || busy === "chat"} className="w-full sm:w-auto">
            {t("buddy.send")}
          </Button>
        </form>
      </section>

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <NotebookPen className="h-4 w-4 text-primary" aria-hidden />
          {t("buddy.history")}
        </h2>
        {data.conversations.length || data.history.length ? (
          <ul className="divide-y divide-border text-sm">
            {data.conversations.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                <button
                  type="button"
                  className="min-w-0 truncate text-left font-medium hover:underline"
                  onClick={() => void openHistory(c.id)}
                >
                  {c.title}
                  {c.pinned ? (
                    <span className="ms-2 text-xs font-normal text-muted">
                      {t("buddy.pinned")}
                    </span>
                  ) : null}
                </button>
                <span className="shrink-0 text-xs text-muted">{c.messageCount}</span>
              </li>
            ))}
            {data.history.map((h) => (
              <li key={h.id} className="py-2 text-secondary">
                {h.planDate} · {h.headline}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-secondary">{t("buddy.noHistory")}</p>
        )}
      </section>
    </div>
  );
}
