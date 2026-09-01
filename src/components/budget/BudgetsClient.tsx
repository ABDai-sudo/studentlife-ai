"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/validations/expense";
import { formatMoney } from "@/lib/money";
import { mountFetch } from "@/lib/react/mount-fetch";

type Budget = {
  id: string;
  category: string;
  categoryLabel: string;
  amount: number;
  currency: string;
  spent: number;
  remaining: number;
  percentUsed: number;
};

export function BudgetsClient() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [category, setCategory] =
    useState<(typeof EXPENSE_CATEGORIES)[number]>("FOOD");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/budgets", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not load budgets.");
        return;
      }
      setBudgets(json.data.budgets);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return mountFetch(
      "/api/budgets",
      ({ ok, json }) => {
        const body = json as {
          success?: boolean;
          data?: { budgets: Budget[] };
          error?: { message?: string };
        } | null;
        if (!ok || !body?.success) {
          setError(body?.error?.message || "Could not load budgets.");
          setLoading(false);
          return;
        }
        setBudgets(body.data!.budgets);
        setError(null);
        setLoading(false);
      },
      () => {
        setError("Could not reach the server.");
        setLoading(false);
      }
    );
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amount: Number(amount),
          currency: "INR",
          period: "MONTHLY",
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not save budget.");
        return;
      }
      setAmount("");
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this category budget?")) return;
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="grid gap-3 border-b border-border pb-6 sm:grid-cols-3">
        <FormField id="category" label="Category">
          <select
            id="category"
            className="field-input"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as (typeof EXPENSE_CATEGORIES)[number])
            }
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="amount" label="Monthly limit">
          <input
            id="amount"
            type="number"
            min={1}
            required
            className="field-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </FormField>
        <div className="flex items-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save budget"}
          </Button>
        </div>
      </form>

      {error ? (
        <div className="border-s-2 border-error/40 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Loading budgets…</p>
      ) : budgets.length === 0 ? (
        <p className="text-sm text-muted">
          No category budgets yet. Set limits for food, travel, and more.
        </p>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => (
            <div key={b.id}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">
                  {b.categoryLabel} · {formatMoney(b.spent, b.currency)} /{" "}
                  {formatMoney(b.amount, b.currency)}
                </span>
                <button
                  type="button"
                  className="text-xs text-muted hover:text-error"
                  onClick={() => void remove(b.id)}
                >
                  Remove
                </button>
              </div>
              <ProgressBar
                value={b.percentUsed}
                label={`${b.percentUsed}% used · ${formatMoney(b.remaining, b.currency)} left`}
                tone={b.percentUsed >= 70 ? "accent" : "primary"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
