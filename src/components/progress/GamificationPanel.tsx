"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { useTheme } from "@/components/theme/ThemeProvider";
import { getCopy } from "@/lib/personality";

export type GamificationSummary = {
  xpTotal: number;
  level: number;
  levelName: string;
  academicAura: number;
  streak: { current: number; best: number; lastLoggedAt: string | null };
  quests: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    xpReward: number;
  }[];
  challenges: {
    id: string;
    title: string;
    progress: number;
    target: number;
    status: string;
  }[];
  achievements: { id: string; title: string; description: string | null }[];
};

export function GamificationPanel({
  initialSummary,
}: {
  initialSummary: GamificationSummary | null;
}) {
  return <GamificationClient initialSummary={initialSummary} />;
}

export function GamificationClient({
  initialSummary,
}: {
  initialSummary: GamificationSummary | null;
}) {
  const { personality } = useTheme();
  const copy = getCopy(personality);
  const [data, setData] = useState<GamificationSummary | null>(initialSummary);
  const [recap, setRecap] = useState<Record<string, unknown> | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(25);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/progress/gamification", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not load progress.");
      return;
    }
    setData(json.data);
  }, []);

  async function completeQuest(id: string) {
    if (completingId) return;
    setCompletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/progress/quests/${id}/complete`, {
        method: "POST",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not complete quest.");
        return;
      }
      setMsg(copy.quests.completed);
      await load();
    } finally {
      setCompletingId(null);
    }
  }

  async function startSession() {
    const res = await fetch("/api/study-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plannedMinutes: minutes, taskTitle: "Focus Sprint" }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not start session.");
      return;
    }
    setSessionId(json.data.id);
    setMsg(`Focus Sprint started (${minutes} min).`);
  }

  async function completeSession() {
    if (!sessionId) return;
    const res = await fetch("/api/study-sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sessionId }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not complete session.");
      return;
    }
    setSessionId(null);
    setMsg(
      json.data.meaningful
        ? `Session complete. +${json.data.xp?.awarded ?? 0} XP`
        : "Session ended (too short for XP)."
    );
    await load();
  }

  async function loadRecap() {
    const res = await fetch("/api/recap/weekly", { method: "POST" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not build recap.");
      return;
    }
    if (json.data.disabled) {
      setMsg("Weekly recap sharing is disabled in your profile.");
      return;
    }
    setRecap(json.data.payload);
  }

  if (!data) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">
          {error || "Could not load progress."}
        </p>
        <Button type="button" size="sm" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Level"
          value={`${data.level}`}
          hint={data.levelName}
        />
        <StatCard label="XP" value={`${data.xpTotal}`} hint="Meaningful actions only" />
        <StatCard
          label="Streak"
          value={`${data.streak.current}d`}
          hint={
            data.streak.current === 0
              ? copy.streaks.comeback
              : copy.streaks.dayN.replace("{n}", String(data.streak.current))
          }
        />
        <StatCard
          label="Academic aura"
          value={`${data.academicAura}/100`}
          hint="Consistency score — not a punishment"
        />
      </div>

      <div className="card-surface p-5">
        <p className="text-sm font-semibold">Aura</p>
        <div className="mt-3">
          <ProgressBar value={data.academicAura} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-surface p-5">
          <h2 className="text-sm font-semibold">Daily quests</h2>
          <ul className="mt-3 space-y-2">
            {data.quests.map((q) => (
              <li
                key={q.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{q.title}</p>
                  <p className="text-xs text-muted">
                    {q.description} · +{q.xpReward} XP
                  </p>
                </div>
                {q.status === "COMPLETED" ? (
                  <span className="text-xs text-success">Done</span>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    disabled={completingId === q.id}
                    onClick={() => void completeQuest(q.id)}
                  >
                    Complete
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface space-y-3 p-5">
          <h2 className="text-sm font-semibold">Focus Sprint</h2>
          <div className="flex flex-wrap gap-2">
            {[15, 25, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutes(m)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  minutes === m
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border"
                }`}
              >
                {m} min
              </button>
            ))}
          </div>
          {!sessionId ? (
            <Button type="button" onClick={() => void startSession()}>
              Start sprint
            </Button>
          ) : (
            <Button type="button" onClick={() => void completeSession()}>
              Complete sprint
            </Button>
          )}
          <p className="text-xs text-muted">
            XP is awarded only after a meaningful completion.
          </p>
        </section>
      </div>

      <section className="card-surface p-5">
        <h2 className="text-sm font-semibold">Weekly challenges</h2>
        <ul className="mt-3 space-y-2">
          {data.challenges.map((c) => (
            <li key={c.id} className="text-sm">
              <div className="mb-1 flex justify-between">
                <span>{c.title}</span>
                <span className="text-muted">
                  {c.progress}/{c.target}
                </span>
              </div>
              <ProgressBar
                value={Math.min(100, (c.progress / Math.max(1, c.target)) * 100)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="card-surface p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Achievements</h2>
          <Button
            size="sm"
            variant="secondary"
            type="button"
            onClick={() => void loadRecap()}
          >
            Weekly recap
          </Button>
        </div>
        {data.achievements.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Complete quests and sessions to unlock achievements.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.achievements.map((a) => (
              <li key={a.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted">{a.description}</p>
              </li>
            ))}
          </ul>
        )}
        {recap ? (
          <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm">
            <p className="font-semibold">My StudentLife AI Weekly Recap</p>
            <ul className="mt-2 space-y-1 text-secondary">
              <li>Tasks completed: {String(recap.tasksCompleted ?? 0)}</li>
              <li>
                Study time: {String(recap.studyMinutes ?? 0)} minutes
              </li>
              <li>Quizzes completed: {String(recap.quizzesCompleted ?? 0)}</li>
              <li>Current streak: {String(recap.currentStreak ?? 0)} days</li>
              <li>
                Academic aura: {String(recap.academicAura ?? 0)}/100
              </li>
              {recap.moneySaved != null ? (
                <li>Money left buffer: ₹{String(recap.moneySaved)}</li>
              ) : null}
            </ul>
            <p className="mt-3 text-xs text-muted">
              Private preview only — nothing is published automatically.
            </p>
          </div>
        ) : null}
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
