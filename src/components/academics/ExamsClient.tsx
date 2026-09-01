"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { mountFetch } from "@/lib/react/mount-fetch";

type Exam = {
  id: string;
  title: string;
  subject: string;
  examType: string;
  examDate: string;
  location: string | null;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function ExamsClient() {
  const [items, setItems] = useState<Exam[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [examType, setExamType] = useState("MIDTERM");
  const [examDate, setExamDate] = useState(todayIso);
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/exams", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      setItems(
        json.data.exams.map((e: Exam & { examDate: string }) => ({
          ...e,
          examDate: String(e.examDate).slice(0, 10),
        }))
      );
    }
  }, []);

  useEffect(() => {
    return mountFetch("/api/exams", ({ ok, json }) => {
      const body = json as {
        success?: boolean;
        data?: { exams: (Exam & { examDate: string })[] };
      } | null;
      if (ok && body?.success) {
        setItems(
          body.data!.exams.map((e) => ({
            ...e,
            examDate: String(e.examDate).slice(0, 10),
          }))
        );
      }
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subject, examType, examDate, location }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not save.");
      return;
    }
    setTitle("");
    setSubject("");
    setLocation("");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete exam?")) return;
    await fetch(`/api/exams?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="grid gap-3 border-b border-border pb-6 sm:grid-cols-2">
        <FormField id="title" label="Exam title">
          <input id="title" className="field-input" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField id="subject" label="Subject">
          <input id="subject" className="field-input" required value={subject} onChange={(e) => setSubject(e.target.value)} />
        </FormField>
        <FormField id="type" label="Type">
          <select id="type" className="field-input" value={examType} onChange={(e) => setExamType(e.target.value)}>
            <option value="QUIZ">Quiz</option>
            <option value="MIDTERM">Midterm</option>
            <option value="FINAL">Final</option>
            <option value="PRACTICAL">Practical</option>
            <option value="OTHER">Other</option>
          </select>
        </FormField>
        <FormField id="date" label="Date">
          <input id="date" type="date" className="field-input" required value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </FormField>
        <FormField id="location" label="Location (optional)">
          <input id="location" className="field-input" value={location} onChange={(e) => setLocation(e.target.value)} />
        </FormField>
        <div className="flex items-end">
          <Button type="submit">Add exam</Button>
        </div>
      </form>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <ul className="divide-y divide-border">
        {items.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div>
              <p className="font-semibold">{e.title}</p>
              <p className="text-xs text-muted">
                {e.subject} · {e.examType} · {e.examDate}
                {e.location ? ` · ${e.location}` : ""}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => void remove(e.id)}>Delete</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
