"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { StatCard } from "@/components/ui/StatCard";
import { formatMoney } from "@/lib/money";

type Result = {
  itemName: string;
  itemCost: number;
  currency: string;
  verdict: "yes" | "caution" | "no";
  moneyLeft: number | null;
  daysLeft: number;
  safePerDayBefore: number | null;
  safePerDayAfter: number | null;
  monthsToAfford: number;
  tips: string[];
  fasterScenarios: { label: string; months: number; action: string }[];
};

export function AffordClient() {
  const [itemName, setItemName] = useState("");
  const [itemCost, setItemCost] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/afford", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName,
          itemCost: Number(itemCost),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not run check.");
        return;
      }
      setResult(json.data.result);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const verdictLabel =
    result?.verdict === "yes"
      ? "Looks affordable"
      : result?.verdict === "caution"
        ? "Affordable with caution"
        : "Better wait";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <form onSubmit={onSubmit} className="card-surface space-y-4 p-5">
        <FormField id="item" label="What do you want to buy?">
          <input
            id="item"
            className="field-input"
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Running shoes"
          />
        </FormField>
        <FormField id="cost" label="Price">
          <input
            id="cost"
            type="number"
            min={1}
            required
            className="field-input"
            value={itemCost}
            onChange={(e) => setItemCost(e.target.value)}
          />
        </FormField>
        <Button type="submit" disabled={loading}>
          {loading ? "Checking…" : "Can I afford it?"}
        </Button>
      </form>

      {error ? (
        <div className="rounded-xl border border-error/20 bg-red-50 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="card-surface space-y-4 p-5">
          <h3 className="text-lg font-semibold">{verdictLabel}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Item cost"
              value={formatMoney(result.itemCost, result.currency)}
            />
            <StatCard
              label="Safe / day before"
              value={
                result.safePerDayBefore == null
                  ? "—"
                  : formatMoney(result.safePerDayBefore, result.currency)
              }
            />
            <StatCard
              label="Safe / day after"
              value={
                result.safePerDayAfter == null
                  ? "—"
                  : formatMoney(result.safePerDayAfter, result.currency)
              }
            />
          </div>
          <ul className="space-y-2 text-sm text-secondary">
            {result.tips.map((tip) => (
              <li key={tip}>• {tip}</li>
            ))}
          </ul>
          {result.monthsToAfford > 0 ? (
            <p className="text-sm text-muted">
              At your current savings pace, about {result.monthsToAfford} month(s)
              to afford from savings alone.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
