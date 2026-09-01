"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

type Subject = { id: string; name: string };
type Note = {
  id: string;
  title: string;
  content: string;
  subject: { id: string; name: string } | null;
  updatedAt: string;
};

export function NotesClient() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [nRes, sRes] = await Promise.all([
      fetch("/api/notes", { cache: "no-store" }),
      fetch("/api/subjects", { cache: "no-store" }),
    ]);
    const nJson = await nRes.json().catch(() => null);
    const sJson = await sRes.json().catch(() => null);
    if (nRes.ok && nJson?.success) setNotes(nJson.data.notes);
    if (sRes.ok && sJson?.success) setSubjects(sJson.data.subjects);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/notes", { cache: "no-store" }).then(async (res) => ({
        res,
        json: await res.json().catch(() => null),
      })),
      fetch("/api/subjects", { cache: "no-store" }).then(async (res) => ({
        res,
        json: await res.json().catch(() => null),
      })),
    ]).then(([n, s]) => {
      if (cancelled) return;
      if (n.res.ok && n.json?.success) setNotes(n.json.data.notes);
      if (s.res.ok && s.json?.success) setSubjects(s.json.data.subjects);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        subjectId: subjectId || null,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not save note.");
      return;
    }
    setTitle("");
    setContent("");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3 border-b border-border pb-6">
        <FormField id="title" label="Title">
          <input id="title" className="field-input" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField id="subject" label="Subject (optional)">
          <select id="subject" className="field-input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">General</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </FormField>
        <FormField id="content" label="Notes">
          <textarea id="content" className="field-input min-h-28" required value={content} onChange={(e) => setContent(e.target.value)} />
        </FormField>
        <Button type="submit">Save note</Button>
      </form>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <div className="divide-y divide-border">
        {notes.map((n) => (
          <article key={n.id} className="py-5">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{n.title}</h3>
                <p className="text-xs text-muted">{n.subject?.name ?? "General"}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => void remove(n.id)}>Delete</Button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-secondary">{n.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
