"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PERSONALITY_I18N_KEYS } from "@/lib/languages";
import { PERSONALITY_MODES, type PersonalityMode } from "@/lib/personality";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { getExplanationLanguages } from "@/lib/i18n/languages-registry";
import { useT } from "@/components/i18n/LocaleProvider";
import { localeToLanguageName } from "@/lib/i18n/config";

const SUBJECT_PRESETS = [
  "Programming",
  "Mathematics",
  "Physics",
  "Chemistry",
  "English",
  "Accounting",
] as const;

const GOAL_OPTIONS = [
  {
    value: "Make pocket money last the month",
    key: "onboarding.goal.money" as const,
  },
  {
    value: "Stay on top of assignments",
    key: "onboarding.goal.assignments" as const,
  },
  {
    value: "Prepare for exams",
    key: "onboarding.goal.exams" as const,
  },
  {
    value: "Build a daily study habit",
    key: "onboarding.goal.habit" as const,
  },
];

export function OnboardingClient() {
  const router = useRouter();
  const { t, locale } = useT();
  const [monthlyPocketMoney, setMonthlyPocketMoney] = useState("5000");
  const [studentType, setStudentType] = useState<"HOSTEL" | "DAY_SCHOLAR">(
    "DAY_SCHOLAR"
  );
  const [primaryGoal, setPrimaryGoal] = useState(GOAL_OPTIONS[0].value);
  const [currency, setCurrency] = useState("INR");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [classOrSemester, setClassOrSemester] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [preferredExplanationLang, setPreferredExplanationLang] =
    useState("English");
  const [personalityMode, setPersonalityMode] =
    useState<PersonalityMode>("PROFESSIONAL");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subjectSet = useMemo(
    () => new Set(subjects.map((s) => s.toLowerCase())),
    [subjects]
  );

  function toggleSubject(name: string) {
    setSubjects((prev) =>
      prev.some((s) => s.toLowerCase() === name.toLowerCase())
        ? prev.filter((s) => s.toLowerCase() !== name.toLowerCase())
        : prev.length >= 5
          ? prev
          : [...prev, name]
    );
  }

  function addCustomSubject() {
    const name = customSubject.trim().slice(0, 100);
    if (!name) return;
    if (subjectSet.has(name.toLowerCase())) {
      setCustomSubject("");
      return;
    }
    if (subjects.length >= 5) return;
    setSubjects((prev) => [...prev, name]);
    setCustomSubject("");
  }

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
          university: university.trim() || undefined,
          institutionName: university.trim() || undefined,
          course: course.trim() || undefined,
          classOrSemester: classOrSemester.trim() || undefined,
          preferredExplanationLang,
          preferredUiLanguage: localeToLanguageName(locale),
          personalityMode,
          studyGoal: primaryGoal,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || t("onboarding.error.save"));
        return;
      }

      await Promise.all(
        subjects.map((name) =>
          fetch("/api/subjects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          }).catch(() => undefined)
        )
      );

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("errors.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t("onboarding.title")} subtitle={t("onboarding.subtitle")}>
      <form method="post" action="/onboarding" onSubmit={onSubmit} className="auth-form space-y-5">
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t("onboarding.sectionStudy")}
          </legend>
          <FormField
            id="university"
            label={t("onboarding.college")}
            hint={t("onboarding.collegeHint")}
          >
            <input
              id="university"
              required
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="field-input auth-input"
              placeholder={t("onboarding.collegePlaceholder")}
              autoComplete="organization"
              maxLength={200}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="course" label={t("onboarding.course")}>
              <input
                id="course"
                required
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="field-input auth-input"
                placeholder={t("onboarding.coursePlaceholder")}
                maxLength={200}
              />
            </FormField>
            <FormField id="semester" label={t("onboarding.semester")}>
              <input
                id="semester"
                required
                value={classOrSemester}
                onChange={(e) => setClassOrSemester(e.target.value)}
                className="field-input auth-input"
                placeholder={t("onboarding.semesterPlaceholder")}
                maxLength={80}
              />
            </FormField>
          </div>
          <FormField
            id="subjects"
            label={t("onboarding.subjects")}
            hint={t("onboarding.subjectsHint")}
          >
            <div className="flex flex-wrap gap-2" id="subjects">
              {SUBJECT_PRESETS.map((name) => {
                const selected = subjectSet.has(name.toLowerCase());
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={selected}
                    className={`min-h-11 rounded-lg border px-3 text-sm font-medium ${
                      selected
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border text-secondary"
                    }`}
                    onClick={() => toggleSubject(name)}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                id="customSubject"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="field-input auth-input"
                placeholder={t("onboarding.subjectCustom")}
                maxLength={100}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSubject();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 shrink-0"
                onClick={addCustomSubject}
              >
                {t("onboarding.subjectAdd")}
              </Button>
            </div>
          </FormField>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t("onboarding.sectionMoney")}
          </legend>
          <FormField
            id="pocket"
            label={t("onboarding.pocket")}
            hint={t("onboarding.pocketHint")}
          >
            <input
              id="pocket"
              type="number"
              min={1}
              required
              inputMode="numeric"
              value={monthlyPocketMoney}
              onChange={(e) => setMonthlyPocketMoney(e.target.value)}
              className="field-input auth-input"
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="currency" label={t("onboarding.currency")}>
              <select
                id="currency"
                className="field-input auth-input"
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
            <FormField id="studentType" label={t("onboarding.studentType")}>
              <select
                id="studentType"
                className="field-input auth-input"
                value={studentType}
                onChange={(e) =>
                  setStudentType(e.target.value as "HOSTEL" | "DAY_SCHOLAR")
                }
              >
                <option value="DAY_SCHOLAR">{t("onboarding.dayScholar")}</option>
                <option value="HOSTEL">{t("onboarding.hostel")}</option>
              </select>
            </FormField>
          </div>
          <FormField id="goal" label={t("onboarding.goal")}>
            <select
              id="goal"
              className="field-input auth-input"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
            >
              {GOAL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.key)}
                </option>
              ))}
            </select>
          </FormField>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t("onboarding.sectionPrefs")}
          </legend>
          <FormField id="lang" label={t("onboarding.lang")}>
            <LanguageSelector
              id="lang"
              value={preferredExplanationLang}
              options={getExplanationLanguages()}
              onlyReadySelectable={false}
              searchPlaceholder={t("settings.languageSearch")}
              comingSoonLabel={t("settings.languageComingSoon")}
              onChange={setPreferredExplanationLang}
            />
          </FormField>
          <FormField id="personality" label={t("onboarding.personality")}>
            <select
              id="personality"
              className="field-input auth-input"
              value={personalityMode}
              onChange={(e) =>
                setPersonalityMode(e.target.value as PersonalityMode)
              }
            >
              {PERSONALITY_MODES.map((m) => (
                <option key={m} value={m}>
                  {t(PERSONALITY_I18N_KEYS[m])}
                </option>
              ))}
            </select>
          </FormField>
        </fieldset>

        {error ? (
          <div
            className="rounded-[10px] border border-error/25 bg-error-soft px-3.5 py-2.5 text-sm text-error"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <Button type="submit" className="auth-submit w-full" disabled={loading}>
          {loading ? t("onboarding.saving") : t("onboarding.submit")}
        </Button>
      </form>
    </AuthShell>
  );
}
