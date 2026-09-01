"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { SafeMarkdown } from "@/components/ui/SafeMarkdown";

const MODES = [
  "OUTLINE",
  "GUIDED_DRAFT",
  "FULL_DRAFT",
  "EXAM_STYLE",
  "PRESENTATION",
  "VIVA_PREP",
] as const;

export function AssignmentHelperClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    question: "",
    subject: "",
    institution: "",
    course: "",
    semester: "",
    marks: "",
    wordLimit: "",
    dueDate: "",
    instructions: "",
    citationStyle: "",
    language: "English",
    difficulty: "medium",
    mode: "GUIDED_DRAFT" as (typeof MODES)[number],
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assignment-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          question: form.question,
          subject: form.subject || undefined,
          institution: form.institution || undefined,
          course: form.course || undefined,
          semester: form.semester || undefined,
          marks: form.marks ? Number(form.marks) : undefined,
          wordLimit: form.wordLimit ? Number(form.wordLimit) : undefined,
          dueDate: form.dueDate || undefined,
          instructions: form.instructions || undefined,
          citationStyle: form.citationStyle || undefined,
          language: form.language || undefined,
          difficulty: form.difficulty,
          mode: form.mode,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not generate draft.");
        return;
      }
      setOutput(json.data.draft.output);
      setDraftId(json.data.draft.id);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function saveEdits() {
    if (!draftId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/assignment-helper", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draftId, output }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not save.");
        return;
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function addDeadlineTask() {
    if (!form.dueDate || !form.title) return;
    await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        subject: form.subject || "",
        description: form.question.slice(0, 500),
        dueDate: form.dueDate,
        priority: 1,
      }),
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={onGenerate} className="space-y-3 border-b border-border pb-6 lg:border-b-0 lg:border-e lg:pe-8 lg:pb-0">
        <p className="text-sm font-semibold">Assignment details</p>
        <FormField id="title" label="Assignment title">
          <input
            id="title"
            className="field-input"
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </FormField>
        <FormField id="question" label="Exact question">
          <textarea
            id="question"
            className="field-input min-h-28"
            required
            value={form.question}
            onChange={(e) => set("question", e.target.value)}
          />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="subject" label="Subject">
            <input
              id="subject"
              className="field-input"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
            />
          </FormField>
          <FormField id="mode" label="Output mode">
            <select
              id="mode"
              className="field-input"
              value={form.mode}
              onChange={(e) =>
                set("mode", e.target.value as (typeof MODES)[number])
              }
            >
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {m.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="institution" label="Institution">
            <input
              id="institution"
              className="field-input"
              value={form.institution}
              onChange={(e) => set("institution", e.target.value)}
            />
          </FormField>
          <FormField id="course" label="Course / class">
            <input
              id="course"
              className="field-input"
              value={form.course}
              onChange={(e) => set("course", e.target.value)}
            />
          </FormField>
          <FormField id="semester" label="Semester">
            <input
              id="semester"
              className="field-input"
              value={form.semester}
              onChange={(e) => set("semester", e.target.value)}
            />
          </FormField>
          <FormField id="dueDate" label="Submission date">
            <input
              id="dueDate"
              type="date"
              className="field-input"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </FormField>
          <FormField id="marks" label="Marks">
            <input
              id="marks"
              type="number"
              className="field-input"
              value={form.marks}
              onChange={(e) => set("marks", e.target.value)}
            />
          </FormField>
          <FormField id="wordLimit" label="Word limit">
            <input
              id="wordLimit"
              type="number"
              className="field-input"
              value={form.wordLimit}
              onChange={(e) => set("wordLimit", e.target.value)}
            />
          </FormField>
        </div>
        <FormField id="instructions" label="Teacher instructions">
          <textarea
            id="instructions"
            className="field-input"
            value={form.instructions}
            onChange={(e) => set("instructions", e.target.value)}
          />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="citation" label="Citation style">
            <input
              id="citation"
              className="field-input"
              placeholder="APA / MLA / none"
              value={form.citationStyle}
              onChange={(e) => set("citationStyle", e.target.value)}
            />
          </FormField>
          <FormField id="difficulty" label="Difficulty">
            <select
              id="difficulty"
              className="field-input"
              value={form.difficulty}
              onChange={(e) => set("difficulty", e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </FormField>
        </div>
        <p className="text-xs text-muted">
          Use this to learn and structure your work. Review facts, follow your
          teacher, and rewrite in your own voice. Never invent citations.
        </p>
        <Button type="submit" disabled={loading}>
          {loading ? "Generating…" : "Generate"}
        </Button>
        {error ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Editable output</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!draftId || loading}
              onClick={() => void saveEdits()}
            >
              Save edits
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!form.dueDate}
              onClick={() => void addDeadlineTask()}
            >
              Add deadline to tasks
            </Button>
          </div>
        </div>
        {output ? (
          <>
            <textarea
              className="field-input min-h-64 font-mono text-xs"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              aria-label="Draft output"
            />
            <div className="rounded-lg border border-border bg-background p-4">
              <SafeMarkdown content={output} />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">
            Generate a draft to preview and edit it here.
          </p>
        )}
      </div>
    </div>
  );
}
