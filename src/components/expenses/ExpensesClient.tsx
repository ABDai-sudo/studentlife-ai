"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/validations/expense";
import { mountFetch } from "@/lib/react/mount-fetch";

type ExpenseRow = {
  id: string;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  date: string;
};

type Summary = {
  monthTotal: number;
  todayTotal: number;
  topCategory: string | null;
};

function formatMoney(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ExpensesClient() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    monthTotal: 0,
    todayTotal: 0,
    topCategory: null,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<(typeof EXPENSE_CATEGORIES)[number]>("FOOD");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayIso);

  const load = useCallback(async (nextPage = page, cat = categoryFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: "20",
        category: cat,
      });
      const res = await fetch(`/api/expenses?${params}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(
          json?.error?.message ||
            "Could not load expenses. Is the database running?"
        );
        setExpenses([]);
        return;
      }
      setExpenses(json.data.expenses);
      setSummary(json.data.summary);
      setTotal(json.data.total);
      setPage(json.data.page);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter]);

  useEffect(() => {
    const params = new URLSearchParams({
      page: "1",
      pageSize: "20",
      category: categoryFilter,
    });
    return mountFetch(
      `/api/expenses?${params}`,
      ({ ok, json }) => {
        const body = json as {
          success?: boolean;
          data?: {
            expenses: ExpenseRow[];
            summary: Summary;
            total: number;
            page: number;
          };
          error?: { message?: string };
        } | null;
        if (!ok || !body?.success) {
          setError(
            body?.error?.message ||
              "Could not load expenses. Is the database running?"
          );
          setExpenses([]);
          setLoading(false);
          return;
        }
        setExpenses(body.data!.expenses);
        setSummary(body.data!.summary);
        setTotal(body.data!.total);
        setPage(body.data!.page);
        setError(null);
        setLoading(false);
      },
      () => {
        setError("Could not reach the server.");
        setLoading(false);
      }
    );
  }, [categoryFilter]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          category,
          description,
          date,
          currency: "INR",
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setFormError(json?.error?.message || "Could not save expense.");
        return;
      }
      setAmount("");
      setDescription("");
      setDate(todayIso());
      setCategory("FOOD");
      await load(1, categoryFilter);
    } catch {
      setFormError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    const okConfirm = window.confirm("Delete this expense?");
    if (!okConfirm) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete expense.");
      return;
    }
    await load(page, categoryFilter);
  }

  const topLabel = summary.topCategory
    ? EXPENSE_CATEGORY_LABELS[
        summary.topCategory as (typeof EXPENSE_CATEGORIES)[number]
      ] ?? summary.topCategory
    : "—";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="This month"
          value={formatMoney(summary.monthTotal)}
          hint="All categories"
        />
        <StatCard
          label="Today"
          value={formatMoney(summary.todayTotal)}
          hint="Logged today"
        />
        <StatCard label="Top category" value={topLabel} hint="This month" />
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 border-b border-border pb-6"
        aria-label="Add expense"
      >
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Log an expense
          </h2>
          <p className="mt-1 text-sm text-muted">
            Saved to your account — only you can see it.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="amount" label="Amount" error={null}>
            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="field-input"
              placeholder="120"
            />
          </FormField>
          <FormField id="date" label="Date">
            <input
              id="date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field-input"
            />
          </FormField>
          <FormField id="category" label="Category">
            <select
              id="category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as (typeof EXPENSE_CATEGORIES)[number])
              }
              className="field-input"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {EXPENSE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="description" label="Note (optional)">
            <input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field-input"
              placeholder="Lunch, metro, books…"
              maxLength={200}
            />
          </FormField>
        </div>
        {formError ? (
          <p className="text-sm text-error" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" disabled={saving} size="lg">
          {saving ? "Saving…" : "Save expense"}
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Your expenses</h2>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setPage(1);
            setLoading(true);
            setCategoryFilter(e.target.value);
          }}
          className="field-input min-h-11 w-auto"
          aria-label="Filter by category"
        >
          <option value="ALL">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EXPENSE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="border-s-2 border-warning/50 px-4 py-3 text-sm text-secondary">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-6 text-sm text-muted">
          Loading expenses…
        </div>
      ) : expenses.length === 0 ? (
        <div className="py-6">
          <p className="font-medium text-foreground">No expenses yet</p>
          <p className="mt-1 text-sm text-muted">
            Add your first spend above — food, travel, education, and more.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Note</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((row) => (
                <tr key={row.id} className="border-b border-border/70">
                  <td className="px-3 py-3 whitespace-nowrap">{row.date}</td>
                  <td className="px-3 py-3">
                    {EXPENSE_CATEGORY_LABELS[
                      row.category as (typeof EXPENSE_CATEGORIES)[number]
                    ] ?? row.category}
                  </td>
                  <td className="px-3 py-3 text-secondary">
                    {row.description || "—"}
                  </td>
                  <td className="px-3 py-3 font-medium">
                    {formatMoney(row.amount, row.currency)}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => void onDelete(row.id)}
                      className="min-h-11 text-sm text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">
          Page {page} · {total} total
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            className="min-h-11 rounded-lg border border-border px-3 disabled:opacity-40"
            onClick={() => void load(page - 1, categoryFilter)}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page * 20 >= total || loading}
            className="min-h-11 rounded-lg border border-border px-3 disabled:opacity-40"
            onClick={() => void load(page + 1, categoryFilter)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
