"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { formatMoney } from "@/lib/money";
import { mountFetch } from "@/lib/react/mount-fetch";

type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  monthlyContribution: number | null;
  progressPercent: number;
  status: string;
};

export function GoalsClient() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goals", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not load goals.");
        return;
      }
      setGoals(json.data.goals);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return mountFetch(
      "/api/goals",
      ({ ok, json }) => {
        const body = json as {
          success?: boolean;
          data?: { goals: Goal[] };
          error?: { message?: string };
        } | null;
        if (!ok || !body?.success) {
          setError(body?.error?.message || "Could not load goals.");
          setLoading(false);
          return;
        }
        setGoals(body.data!.goals);
        setError(null);
        setLoading(false);
      },
      () => {
        setError("Could not reach the server.");
        setLoading(false);
      }
    );
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          targetAmount: Number(targetAmount),
          monthlyContribution: monthlyContribution
            ? Number(monthlyContribution)
            : undefined,
          currency: "INR",
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not create goal.");
        return;
      }
      setTitle("");
      setTargetAmount("");
      setMonthlyContribution("");
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function contribute(id: string) {
    const raw = window.prompt("How much did you save toward this goal?");
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const res = await fetch(`/api/goals/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (res.ok) await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this goal?")) return;
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onCreate} className="grid gap-3 border-b border-border pb-6 sm:grid-cols-2">
        <FormField id="title" label="Goal title">
          <input
            id="title"
            className="field-input"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New laptop"
          />
        </FormField>
        <FormField id="target" label="Target amount">
          <input
            id="target"
            type="number"
            min={1}
            required
            className="field-input"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />
        </FormField>
        <FormField id="monthly" label="Monthly contribution (optional)">
          <input
            id="monthly"
            type="number"
            min={0}
            className="field-input"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
          />
        </FormField>
        <div className="flex items-end">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : "Add goal"}
          </Button>
        </div>
      </form>

      {error ? (
        <div className="border-s-2 border-error/40 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Loading goals…</p>
      ) : goals.length === 0 ? (
        <p className="text-sm text-muted">No goals yet. Add your first dream purchase.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {goals.map((g) => (
            <div key={g.id} className="border-t border-border pt-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{g.title}</h3>
                  <p className="text-xs text-muted">{g.status}</p>
                </div>
                <StatCard
                  label="Progress"
                  value={`${g.progressPercent}%`}
                  hint={`${formatMoney(g.currentAmount, g.currency)} / ${formatMoney(g.targetAmount, g.currency)}`}
                />
              </div>
              <ProgressBar value={g.progressPercent} label="Saved" />
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => void contribute(g.id)}>
                  Add savings
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void remove(g.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
