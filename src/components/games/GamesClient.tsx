"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { mountFetch } from "@/lib/react/mount-fetch";
import { useT } from "@/components/i18n/LocaleProvider";

type Summary = {
  xpTotal: number;
  level: number;
  levelName: string;
  academicAura: number;
  streak: { current: number; best: number };
  quests: {
    id: string;
    title: string;
    status: string;
    xpReward: number;
  }[];
};

type Card = { id: string; front: string; back: string };
type Deck = { id: string; title: string; cards: Card[] };

const QUIZ = [
  {
    q: "Best first step before exam week?",
    options: [
      "Cram everything overnight",
      "List topics and weak areas",
      "Skip all sleep",
      "Only reread highlights",
    ],
    a: 1,
    explain: "A clear topic list helps you prioritize weak chapters first.",
  },
  {
    q: "XP should reward:",
    options: [
      "Random clicking",
      "Meaningful study actions",
      "Changing theme",
      "Opening settings",
    ],
    a: 1,
    explain: "Streaks and XP unlock from real study work, not spam clicks.",
  },
  {
    q: "If syllabus is missing, the AI should:",
    options: [
      "Invent college rules",
      "Say it does not know and ask for topics",
      "Fake citations",
      "Ignore your question",
    ],
    a: 1,
    explain: "Never invent institution-specific details.",
  },
  {
    q: "Assignment Helper is best used to:",
    options: [
      "Submit without reading",
      "Learn, edit, and verify facts",
      "Create fake references",
      "Skip teacher instructions",
    ],
    a: 1,
    explain: "Always rewrite in your own voice and follow your teacher.",
  },
  {
    q: "Focus Sprint XP is given when:",
    options: [
      "You only open the timer",
      "You meaningfully complete the session",
      "You pause forever",
      "You rename a subject",
    ],
    a: 1,
    explain: "Short abandon sessions do not farm XP.",
  },
] as const;

export function GamesClient({
  initialSummary = null,
}: {
  initialSummary?: Summary | null;
}) {
  const { t } = useT();
  const [data, setData] = useState<Summary | null>(initialSummary);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    initialSummary ? "ready" : "loading"
  );

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState<number | null>(null);

  const [quizActive, setQuizActive] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [lastExplain, setLastExplain] = useState<string | null>(null);

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  const [completingQuestId, setCompletingQuestId] = useState<string | null>(
    null
  );
  const [bossSubject, setBossSubject] = useState("Upcoming exam");
  const [bossProgress, setBossProgress] = useState(20);

  const load = useCallback(async () => {
    setLoadState("loading");
    const res = await fetch("/api/progress/gamification", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || t("games.loadError"));
      setLoadState("error");
      return;
    }
    setData(json.data);
    setError(null);
    setLoadState("ready");
  }, [t]);

  useEffect(() => {
    if (initialSummary) return;
    return mountFetch(
      "/api/progress/gamification",
      ({ ok, json }) => {
        const body = json as {
          success?: boolean;
          data?: Summary;
          error?: { message?: string };
        } | null;
        if (!ok || !body?.success) {
          setError(body?.error?.message || "Could not load games progress.");
          setLoadState("error");
          return;
        }
        setData(body.data!);
        setError(null);
        setLoadState("ready");
      },
      () => {
        setError("Unable to reach the server. Check your connection.");
        setLoadState("error");
      }
    );
  }, [initialSummary]);

  useEffect(() => {
    if (remaining == null || remaining <= 0 || !sessionId) return;
    const id = setInterval(() => {
      setRemaining((r) => (r == null ? r : Math.max(0, r - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [remaining, sessionId]);

  const card = useMemo(
    () => deck?.cards?.[cardIndex] ?? null,
    [deck, cardIndex]
  );

  async function startSprint() {
    setError(null);
    const res = await fetch("/api/study-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plannedMinutes: minutes,
        taskTitle: "Focus Sprint",
        subject: bossSubject,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not start Focus Sprint.");
      return;
    }
    setSessionId(json.data.id);
    setRemaining(minutes * 60);
    setMsg(`Focus Sprint started for ${minutes} minutes.`);
  }

  async function completeSprint() {
    if (!sessionId) return;
    const res = await fetch("/api/study-sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sessionId }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not complete sprint.");
      return;
    }
    setSessionId(null);
    setRemaining(null);
    setBossProgress((p) => Math.min(100, p + 15));
    setMsg(
      json.data.meaningful
        ? `Sprint complete. +${json.data.xp?.awarded ?? 0} XP. Streak updated.`
        : "Sprint was too short for XP. Try at least ~10 minutes."
    );
    await load();
  }

  async function answerQuiz(optionIndex: number) {
    const item = QUIZ[quizIndex];
    const correct = optionIndex === item.a;
    const nextScore = quizScore + (correct ? 1 : 0);
    setLastExplain(item.explain);
    setQuizScore(nextScore);

    if (quizIndex >= QUIZ.length - 1) {
      setQuizActive(false);
      setQuizDone(true);
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Quiz Rush",
          score: nextScore,
          maxScore: QUIZ.length,
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setBossProgress((p) => Math.min(100, p + 10));
        setMsg(
          `Quiz Rush finished: ${nextScore}/${QUIZ.length}. +${json.data.xp?.awarded ?? 0} XP`
        );
      } else {
        setMsg(`Quiz Rush finished: ${nextScore}/${QUIZ.length}`);
      }
      await load();
      return;
    }
    setQuizIndex((i) => i + 1);
  }

  async function createFlashDeck() {
    const res = await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Revision Flashcards",
        subject: bossSubject,
        cards: [
          {
            front: "Before submitting an assignment?",
            back: "Review, verify facts, rewrite in your own voice.",
          },
          {
            front: "How do you keep a streak?",
            back: "One meaningful action daily: session, quest, or quiz.",
          },
          {
            front: "What is Academic Aura?",
            back: "A consistency score — encouraging, not punitive.",
          },
          {
            front: "If syllabus is unknown?",
            back: "Say so and ask for topics or notes.",
          },
          {
            front: "Focus Sprint tip?",
            back: "Pick one subject, silence distractions, finish the block.",
          },
        ],
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not create flashcards.");
      return;
    }
    setDeck(json.data);
    setCardIndex(0);
    setShowBack(false);
    setMsg("Flashcard deck ready.");
  }

  const timerLabel =
    remaining == null
      ? null
      : `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(
          remaining % 60
        ).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary-soft/60 px-4 py-3 text-sm text-secondary">
        {t("games.intro")}
      </div>

      {data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("games.currentStreak")}
            value={`${data.streak.current}`}
            hint={`${t("games.bestStreak")} · ${data.streak.best}`}
          />
          <StatCard
            label={t("dashboard.xp")}
            value={`${data.xpTotal}`}
            hint={data.levelName}
          />
          <StatCard
            label={t("dashboard.level", { level: data.level })}
            value={`${data.level}`}
            hint={data.levelName}
          />
          <StatCard
            label={t("dashboard.academicAura")}
            value={`${data.academicAura}/100`}
            hint={t("games.levelProgress")}
          />
        </div>
      ) : loadState === "error" ? (
        <div className="card-surface alert-error border-error/25 px-5 py-4">
          <p className="text-sm font-semibold text-error">
            {error || t("games.loadError")}
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            type="button"
            onClick={() => void load()}
          >
            {t("games.retry")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      )}

      {data?.quests?.length ? (
        <section className="card-surface p-5 transition-shadow hover:shadow-md">
          <h2 className="text-base font-semibold">{t("games.dailyQuests")}</h2>
          <ul className="mt-3 space-y-2">
            {data.quests.map((q) => (
              <li
                key={q.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>{q.title}</span>
                {q.status === "COMPLETED" ? (
                  <span className="text-xs font-medium text-success">Done</span>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    disabled={completingQuestId === q.id}
                    onClick={async () => {
                      if (completingQuestId) return;
                      setCompletingQuestId(q.id);
                      setError(null);
                      try {
                        const res = await fetch(
                          `/api/progress/quests/${q.id}/complete`,
                          { method: "POST" }
                        );
                        const json = await res.json().catch(() => null);
                        if (!res.ok || !json?.success) {
                          setError(
                            json?.error?.message || t("errors.generic")
                          );
                          return;
                        }
                        setBossProgress((p) => Math.min(100, p + 8));
                        await load();
                        setMsg("Quest completed — XP added.");
                      } catch {
                        setError(t("errors.network"));
                      } finally {
                        setCompletingQuestId(null);
                      }
                    }}
                  >
                    Complete · +{q.xpReward} XP
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card-surface space-y-3 p-5 transition-shadow hover:shadow-md">
        <h2 className="text-base font-semibold">{t("games.focusSprint")}</h2>
        <p className="text-sm text-secondary">
          Distraction-free timer. XP only after meaningful completion.
        </p>
        <div className="flex flex-wrap gap-2">
          {[15, 25, 45, 60].map((m) => (
            <button
              key={m}
              type="button"
              disabled={!!sessionId}
              onClick={() => setMinutes(m)}
              className={`rounded-full border px-3 py-1 text-xs disabled:opacity-50 ${
                minutes === m
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border"
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
        {timerLabel ? (
          <p className="font-mono text-3xl font-semibold tracking-tight">
            {timerLabel}
          </p>
        ) : null}
        {!sessionId ? (
          <Button type="button" onClick={() => void startSprint()}>
            Start Focus Sprint
          </Button>
        ) : (
          <Button type="button" onClick={() => void completeSprint()}>
            Complete sprint & earn XP
          </Button>
        )}
      </section>

      <section className="card-surface space-y-3 p-5">
        <h2 className="text-base font-semibold">{t("games.quizRush")}</h2>
        <p className="text-sm text-secondary">
          Timed-style multiple choice with explanations and XP.
        </p>
        {!quizActive && !quizDone ? (
          <Button
            type="button"
            onClick={() => {
              setQuizActive(true);
              setQuizDone(false);
              setQuizIndex(0);
              setQuizScore(0);
              setLastExplain(null);
            }}
          >
            Start Quiz Rush
          </Button>
        ) : null}
        {quizActive ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Q{quizIndex + 1}/{QUIZ.length}. {QUIZ[quizIndex].q}
            </p>
            <div className="grid gap-2">
              {QUIZ[quizIndex].options.map((opt, i) => (
                <button
                  key={opt}
                  type="button"
                  className="rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-surface-secondary"
                  onClick={() => void answerQuiz(i)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {lastExplain ? (
              <p className="text-xs text-muted">{lastExplain}</p>
            ) : null}
            <ProgressBar value={((quizIndex + 1) / QUIZ.length) * 100} />
          </div>
        ) : null}
        {quizDone ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Final score: {quizScore}/{QUIZ.length}
            </p>
            {lastExplain ? (
              <p className="text-xs text-muted">Last tip: {lastExplain}</p>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setQuizDone(false);
                setQuizActive(true);
                setQuizIndex(0);
                setQuizScore(0);
                setLastExplain(null);
              }}
            >
              Play again
            </Button>
          </div>
        ) : null}
      </section>

      <section className="card-surface space-y-3 p-5">
        <h2 className="text-base font-semibold">{t("games.flashcardFlip")}</h2>
        <p className="text-sm text-secondary">
          Tap card to flip. Mark Know or Review again.
        </p>
        {!deck ? (
          <Button type="button" onClick={() => void createFlashDeck()}>
            Create revision deck
          </Button>
        ) : card ? (
          <div className="space-y-3">
            <button
              type="button"
              className="min-h-36 w-full rounded-xl border border-border bg-background px-4 py-6 text-left"
              onClick={() => setShowBack((v) => !v)}
            >
              <p className="text-xs uppercase tracking-wide text-muted">
                {showBack ? "Answer" : "Question"} · tap to flip ·{" "}
                {cardIndex + 1}/{deck.cards.length}
              </p>
              <p className="mt-3 text-sm font-medium leading-relaxed">
                {showBack ? card.back : card.front}
              </p>
            </button>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                type="button"
                onClick={async () => {
                  await fetch("/api/flashcards", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cardId: card.id, know: true }),
                  });
                  setShowBack(false);
                  setCardIndex((i) => (i + 1) % deck.cards.length);
                  setBossProgress((p) => Math.min(100, p + 3));
                }}
              >
                Know
              </Button>
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={async () => {
                  await fetch("/api/flashcards", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cardId: card.id, know: false }),
                  });
                  setShowBack(false);
                  setCardIndex((i) => (i + 1) % deck.cards.length);
                }}
              >
                Review again
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="card-surface space-y-3 p-5">
        <h2 className="text-base font-semibold">{t("games.examBoss")}</h2>
        <p className="text-sm text-secondary">
          Treat your next exam as the boss. Progress rises when you complete
          sprints, quizzes, and quests.
        </p>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Boss (exam / subject)</span>
          <input
            className="field-input"
            value={bossSubject}
            onChange={(e) => setBossSubject(e.target.value)}
            placeholder="e.g. Midterm — Data Structures"
          />
        </label>
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>Prep progress</span>
            <span>{bossProgress}%</span>
          </div>
          <ProgressBar value={bossProgress} tone="ai" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href="/dashboard/exam-prep" variant="secondary" size="sm">
            Open Exam Prep
          </Button>
          <Button href="/dashboard/emergency" variant="secondary" size="sm">
            Emergency plan
          </Button>
          <Button href="/dashboard/question-generator" size="sm">
            Generate practice paper
          </Button>
        </div>
      </section>

      {msg ? <p className="text-sm text-primary">{msg}</p> : null}
      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
