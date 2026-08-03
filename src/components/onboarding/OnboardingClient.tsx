"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

export function OnboardingClient() {
  const router = useRouter();
  const [monthlyPocketMoney, setMonthlyPocketMoney] = useState("5000");
  const [studentType, setStudentType] = useState<"HOSTEL" | "DAY_SCHOLAR">(
    "DAY_SCHOLAR"
  );
  const [primaryGoal, setPrimaryGoal] = useState("Make pocket money last the month");
  const [currency, setCurrency] = useState("INR");
  const [university, setUniversity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyPocketMoney: Number(monthlyPocketMoney),
          studentType,
          primaryGoal,
          currency,
          country: currency === "INR" ? "IN" : "US",
          university: university || undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not save onboarding.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Set up your money plan"
      subtitle="Tell us your monthly pocket money so safe daily spend can work."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField id="pocket" label="Monthly pocket money" hint="What you usually get each month">
          <input
            id="pocket"
            type="number"
            min={1}
            required
            value={monthlyPocketMoney}
            onChange={(e) => setMonthlyPocketMoney(e.target.value)}
            className="field-input"
          />
        </FormField>

        <FormField id="currency" label="Currency">
          <select
            id="currency"
            className="field-input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
            <option value="AED">AED</option>
          </select>
        </FormField>

        <FormField id="studentType" label="Student type">
          <select
            id="studentType"
            className="field-input"
            value={studentType}
            onChange={(e) =>
              setStudentType(e.target.value as "HOSTEL" | "DAY_SCHOLAR")
            }
          >
            <option value="DAY_SCHOLAR">Day scholar</option>
            <option value="HOSTEL">Hostel</option>
          </select>
        </FormField>

        <FormField id="goal" label="Primary money goal">
          <input
            id="goal"
            required
            value={primaryGoal}
            onChange={(e) => setPrimaryGoal(e.target.value)}
            className="field-input"
            maxLength={200}
          />
        </FormField>

        <FormField id="university" label="University (optional)">
          <input
            id="university"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="field-input"
            placeholder="College / university name"
          />
        </FormField>

        {error ? (
          <div className="rounded-[10px] border border-error/20 bg-red-50 px-3.5 py-2.5 text-sm text-error">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Start money dashboard"}
        </Button>
      </form>
    </AuthShell>
  );
}
