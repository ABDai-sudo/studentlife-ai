"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PERSONALITY_LABELS } from "@/lib/languages";
import { PERSONALITY_MODES, type PersonalityMode } from "@/lib/personality";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { getExplanationLanguages } from "@/lib/i18n/languages-registry";

export function OnboardingClient() {
  const router = useRouter();
  const [monthlyPocketMoney, setMonthlyPocketMoney] = useState("5000");
  const [studentType, setStudentType] = useState<"HOSTEL" | "DAY_SCHOLAR">(
    "DAY_SCHOLAR"
  );
  const [primaryGoal, setPrimaryGoal] = useState(
    "Make pocket money last the month"
  );
  const [currency, setCurrency] = useState("INR");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [classOrSemester, setClassOrSemester] = useState("");
  const [preferredExplanationLang, setPreferredExplanationLang] =
    useState("English");
  const [personalityMode, setPersonalityMode] =
    useState<PersonalityMode>("PROFESSIONAL");
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
          institutionName: university || undefined,
          course: course || undefined,
          classOrSemester: classOrSemester || undefined,
          preferredExplanationLang,
          personalityMode,
          studyGoal: primaryGoal,
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
      title="Set up StudentLife AI"
      subtitle="Money basics + study preferences. You can change these later."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          id="pocket"
          label="Monthly pocket money"
          hint="What you usually get each month"
        >
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

        <FormField id="goal" label="Primary goal">
          <input
            id="goal"
            required
            value={primaryGoal}
            onChange={(e) => setPrimaryGoal(e.target.value)}
            className="field-input"
            maxLength={200}
          />
        </FormField>

        <FormField id="university" label="School / college (optional)">
          <input
            id="university"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="field-input"
            placeholder="College / university name"
          />
        </FormField>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="course" label="Course (optional)">
            <input
              id="course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="field-input"
              placeholder="B.Tech CSE"
            />
          </FormField>
          <FormField id="semester" label="Semester / class (optional)">
            <input
              id="semester"
              value={classOrSemester}
              onChange={(e) => setClassOrSemester(e.target.value)}
              className="field-input"
              placeholder="Sem 3"
            />
          </FormField>
        </div>

        <FormField id="lang" label="AI explanation language">
          <LanguageSelector
            id="lang"
            value={preferredExplanationLang}
            options={getExplanationLanguages()}
            onlyReadySelectable={false}
            searchPlaceholder="Search languages…"
            comingSoonLabel="Coming soon"
            onChange={setPreferredExplanationLang}
          />
        </FormField>

        <FormField id="personality" label="App personality">
          <select
            id="personality"
            className="field-input"
            value={personalityMode}
            onChange={(e) =>
              setPersonalityMode(e.target.value as PersonalityMode)
            }
          >
            {PERSONALITY_MODES.map((m) => (
              <option key={m} value={m}>
                {PERSONALITY_LABELS[m] || m}
              </option>
            ))}
          </select>
        </FormField>

        {error ? (
          <div className="rounded-[10px] border border-error/25 bg-error-soft px-3.5 py-2.5 text-sm text-error">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Continue to dashboard"}
        </Button>
      </form>
    </AuthShell>
  );
}
