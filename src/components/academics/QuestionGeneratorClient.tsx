"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { mountFetch } from "@/lib/react/mount-fetch";

type Question = {
  id: string;
  orderIndex: number;
  type: string;
  prompt: string;
  answer: string | null;
  explanation: string | null;
  marks: number;
};

type Paper = {
  id: string;
  title: string;
  subject: string;
  institution: string | null;
  course: string | null;
  semester: string | null;
  totalMarks: number | null;
  durationMinutes: number | null;
  instructions: string | null;
  syllabusNote: string | null;
  questions: Question[];
};

const TYPES = [
  "MCQ",
  "TRUE_FALSE",
  "FILL_BLANK",
  "ONE_WORD",
  "VERY_SHORT",
  "SHORT",
  "LONG",
  "CODING",
  "NUMERICAL",
  "PRACTICAL",
  "VIVA",
  "CASE_STUDY",
] as const;

const TYPE_LABELS: Record<(typeof TYPES)[number], string> = {
  MCQ: "MCQ",
  TRUE_FALSE: "True / false",
  FILL_BLANK: "Fill in the blank",
  ONE_WORD: "One word",
  VERY_SHORT: "Very short",
  SHORT: "Short",
  LONG: "Long",
  CODING: "Coding",
  NUMERICAL: "Numerical",
  PRACTICAL: "Practical",
  VIVA: "Viva",
  CASE_STUDY: "Case study",
};

export function QuestionGeneratorClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [saved, setSaved] = useState<{ id: string; title: string }[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [form, setForm] = useState({
    title: "Practice Test",
    subject: "",
    institution: "",
    course: "",
    semester: "",
    unit: "",
    chapter: "",
    topics: "",
    mode: "QUICK_PRACTICE",
    difficulty: "medium",
    questionCount: "10",
    types: ["MCQ", "SHORT"] as string[],
    durationMinutes: "60",
    includeAnswers: true,
  });

  useEffect(() => {
    return mountFetch("/api/question-papers", ({ ok, json }) => {
      const body = json as {
        success?: boolean;
        data?: { id: string; title: string }[];
      } | null;
      if (ok && body?.success) {
        setSaved(
          body.data!.map((p) => ({
            id: p.id,
            title: p.title,
          }))
        );
      }
    });
  }, [paper?.id]);

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/question-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          subject: form.subject,
          institution: form.institution || undefined,
          course: form.course || undefined,
          semester: form.semester || undefined,
          unit: form.unit || undefined,
          chapter: form.chapter || undefined,
          topics: form.topics || undefined,
          mode: form.mode,
          difficulty: form.difficulty,
          questionCount: Number(form.questionCount),
          types: form.types,
          durationMinutes: Number(form.durationMinutes) || undefined,
          includeAnswers: form.includeAnswers,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not generate paper.");
        return;
      }
      setPaper(json.data.paper);
      setShowAnswers(false);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function openPaper(id: string) {
    const res = await fetch(`/api/question-papers/${id}`, { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) setPaper(json.data);
  }

  async function saveQuestion(q: Question) {
    if (!paper) return;
    await fetch(`/api/question-papers/${paper.id}/questions/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: q.prompt,
        answer: q.answer,
        explanation: q.explanation,
        marks: q.marks,
      }),
    });
  }

  function toggleType(t: string) {
    setForm((f) => ({
      ...f,
      types: f.types.includes(t)
        ? f.types.filter((x) => x !== t)
        : [...f.types, t],
    }));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onGenerate} className="space-y-3 border-b border-border pb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField id="title" label="Test title">
            <input
              id="title"
              className="field-input"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </FormField>
          <FormField id="subject" label="Subject">
            <input
              id="subject"
              className="field-input"
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </FormField>
          <FormField id="mode" label="Generation mode">
            <select
              id="mode"
              className="field-input"
              value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value })}
            >
              <option value="QUICK_PRACTICE">Quick Practice</option>
              <option value="CLASS_TEST">Class Test</option>
              <option value="INTERNAL_EXAM">Internal Exam</option>
              <option value="SEMESTER_MOCK">Semester Mock</option>
              <option value="CHAPTER_TEST">Chapter Test</option>
              <option value="VIVA_PRACTICE">Viva Practice</option>
              <option value="PRACTICAL_EXAM">Practical Exam</option>
              <option value="REVISION_QUIZ">Revision Quiz</option>
            </select>
          </FormField>
          <FormField id="institution" label="Institution">
            <input
              id="institution"
              className="field-input"
              value={form.institution}
              onChange={(e) =>
                setForm({ ...form, institution: e.target.value })
              }
            />
          </FormField>
          <FormField id="course" label="Course">
            <input
              id="course"
              className="field-input"
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
            />
          </FormField>
          <FormField id="semester" label="Semester">
            <input
              id="semester"
              className="field-input"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
            />
          </FormField>
          <FormField id="chapter" label="Chapter">
            <input
              id="chapter"
              className="field-input"
              value={form.chapter}
              onChange={(e) => setForm({ ...form, chapter: e.target.value })}
            />
          </FormField>
          <FormField id="count" label="Number of questions">
            <input
              id="count"
              type="number"
              min={3}
              max={40}
              className="field-input"
              value={form.questionCount}
              onChange={(e) =>
                setForm({ ...form, questionCount: e.target.value })
              }
            />
          </FormField>
          <FormField id="duration" label="Duration (minutes)">
            <input
              id="duration"
              type="number"
              className="field-input"
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({ ...form, durationMinutes: e.target.value })
              }
            />
          </FormField>
        </div>
        <FormField id="topics" label="Included topics">
          <textarea
            id="topics"
            className="field-input"
            placeholder="Comma or line separated topics"
            value={form.topics}
            onChange={(e) => setForm({ ...form, topics: e.target.value })}
          />
        </FormField>
        <div>
          <p className="mb-2 text-sm font-medium">Question types</p>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={`rounded-md border px-3 py-1.5 text-xs ${
                  form.types.includes(t)
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border"
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.includeAnswers}
            onChange={(e) =>
              setForm({ ...form, includeAnswers: e.target.checked })
            }
          />
          Include answer key
        </label>
        <Button type="submit" disabled={loading || form.types.length === 0}>
          {loading ? "Generating…" : "Generate paper"}
        </Button>
        {error ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {saved.length > 0 ? (
        <div className="border-t border-border pt-4">
          <p className="mb-2 text-sm font-semibold">Saved papers</p>
          <div className="flex flex-wrap gap-2">
            {saved.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => void openPaper(p.id)}
              >
                {p.title}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {paper ? (
        <div className="space-y-4 print:border-0 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{paper.title}</h2>
              <p className="text-sm text-secondary">
                {[paper.institution, paper.course, paper.semester, paper.subject]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="text-xs text-muted">
                Total marks: {paper.totalMarks ?? "—"}
                {paper.durationMinutes
                  ? ` · ${paper.durationMinutes} min`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => setShowAnswers((v) => !v)}
              >
                {showAnswers ? "Hide answers" : "Answer key"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => window.print()}
              >
                Print
              </Button>
            </div>
          </div>
          {paper.syllabusNote ? (
            <p className="rounded-lg alert-warning px-3 py-2 text-xs text-secondary">
              {paper.syllabusNote}
            </p>
          ) : null}
          {paper.instructions ? (
            <p className="text-sm text-secondary">{paper.instructions}</p>
          ) : null}
          <ol className="space-y-4">
            {paper.questions.map((q, idx) => (
              <li key={q.id} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted">
                  <span>
                    Q{idx + 1} · {TYPE_LABELS[q.type as keyof typeof TYPE_LABELS] ?? q.type}
                  </span>
                  <span>{q.marks} marks</span>
                </div>
                <textarea
                  className="field-input text-sm"
                  value={q.prompt}
                  onChange={(e) =>
                    setPaper({
                      ...paper,
                      questions: paper.questions.map((x) =>
                        x.id === q.id ? { ...x, prompt: e.target.value } : x
                      ),
                    })
                  }
                  onBlur={() => void saveQuestion(q)}
                />
                {showAnswers ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Answer: </span>
                      {q.answer || "—"}
                    </p>
                    {q.explanation ? (
                      <p className="text-muted">{q.explanation}</p>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={async () => {
                      await fetch(
                        `/api/question-papers/${paper.id}/questions/${q.id}`,
                        { method: "DELETE" }
                      );
                      setPaper({
                        ...paper,
                        questions: paper.questions.filter((x) => x.id !== q.id),
                      });
                    }}
                  >
                    Delete question
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
