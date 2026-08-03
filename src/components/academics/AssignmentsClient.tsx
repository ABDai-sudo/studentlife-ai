"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

type Assignment = {
  id: string;
  title: string;
  subject: string | null;
  dueDate: string;
  status: string;
  priority: number;
};

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function AssignmentsClient() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState(todayIso);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/assignments", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      setItems(
        json.data.assignments.map((a: Assignment & { dueDate: string | Date }) => ({
          ...a,
          dueDate: String(a.dueDate).slice(0, 10),
        }))
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subject, dueDate, priority: 2 }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not save.");
      return;
    }
    setTitle("");
    setSubject("");
    await load();
  }

  async function markDone(id: string) {
    await fetch("/api/assignments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "SUBMITTED" }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete assignment?")) return;
    await fetch(`/api/assignments?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="card-surface grid gap-3 p-5 sm:grid-cols-3">
        <FormField id="title" label="Homework title">
          <input id="title" className="field-input" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField id="subject" label="Class">
          <input id="subject" className="field-input" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </FormField>
        <FormField id="due" label="Due date">
          <input id="due" type="date" className="field-input" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </FormField>
        <div className="sm:col-span-3">
          <Button type="submit">Add homework</Button>
        </div>
      </form>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.id} className="card-surface flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-semibold">{a.title}</p>
              <p className="text-xs text-muted">
                {a.subject || "General"} · due {a.dueDate} · {a.status}
              </p>
            </div>
            <div className="flex gap-2">
              {a.status !== "SUBMITTED" && a.status !== "GRADED" ? (
                <Button size="sm" variant="secondary" onClick={() => void markDone(a.id)}>
                  Mark done
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" onClick={() => void remove(a.id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
