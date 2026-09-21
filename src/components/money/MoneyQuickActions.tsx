"use client";

import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/LocaleProvider";
import { useRouter } from "next/navigation";

export function MoneyQuickActions({ coachCta }: { coachCta: string }) {
  const { t } = useT();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    setSaving(true);
    setError(null);
    const clientRequestId = requestIdRef.current ?? crypto.randomUUID();
    requestIdRef.current = clientRequestId;
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: value,
          currency: "INR",
          clientRequestId,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not save expense.");
        return;
      }
      requestIdRef.current = null;
      setAmount("");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-4 space-y-3">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        aria-label="Quick add expense"
      >
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-muted">Amount (₹)</span>
          <input
            className="field-input"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="120"
            required
          />
        </label>
        <Button type="submit" disabled={saving || !amount}>
          {saving ? t("loading.generic") : t("money.logExpense")}
        </Button>
      </form>
      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button href="/dashboard/expenses" size="sm" variant="secondary">
          {t("money.openExpenses")}
        </Button>
        <Button href="/dashboard/budget" variant="secondary" size="sm">
          {t("money.setBudgets")}
        </Button>
        <Button href="/dashboard/ai-coach" size="sm">
          {coachCta}
        </Button>
      </div>
    </div>
  );
}
