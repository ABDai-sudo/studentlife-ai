"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { mountFetch } from "@/lib/react/mount-fetch";

type Subject = {
  id: string;
  name: string;
  code: string | null;
  instructor: string | null;
  credits: number | null;
};

export function SubjectsClient() {
  const [items, setItems] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [instructor, setInstructor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/subjects", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not load subjects.");
      setLoading(false);
      return;
    }
    setItems(json.data.subjects);
    setLoading(false);
  }, []);

  useEffect(() => {
    return mountFetch(
      "/api/subjects",
      ({ ok, json }) => {
        const body = json as {
          success?: boolean;
          data?: { subjects: Subject[] };
          error?: { message?: string };
        } | null;
        if (!ok || !body?.success) {
          setError(body?.error?.message || "Could not load subjects.");
          setLoading(false);
          return;
        }
        setItems(body.data!.subjects);
        setLoading(false);
      },
      () => {
        setError("Could not reach the server.");
        setLoading(false);
      }
    );
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, instructor }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not save.");
      return;
    }
    setName("");
    setCode("");
    setInstructor("");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this subject?")) return;
    await fetch(`/api/subjects?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="grid gap-3 border-b border-border pb-6 sm:grid-cols-3">
        <FormField id="name" label="Subject name">
          <input id="name" className="field-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Mathematics" />
        </FormField>
        <FormField id="code" label="Code (optional)">
          <input id="code" className="field-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="MATH101" />
        </FormField>
        <FormField id="instructor" label="Teacher (optional)">
          <input id="instructor" className="field-input" value={instructor} onChange={(e) => setInstructor(e.target.value)} />
        </FormField>
        <div className="sm:col-span-3">
          <Button type="submit">Add subject</Button>
        </div>
      </form>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">No subjects yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted">
                  {[s.code, s.instructor].filter(Boolean).join(" · ") || "No details"}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => void remove(s.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
