"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { mountFetch } from "@/lib/react/mount-fetch";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Slot = {
  id: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
  subject: { id: string; name: string } | null;
};

export function TimetableClient() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [title, setTitle] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/timetable", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) setSlots(json.data.slots);
  }, []);

  useEffect(() => {
    return mountFetch("/api/timetable", ({ ok, json }) => {
      const body = json as {
        success?: boolean;
        data?: { slots: Slot[] };
      } | null;
      if (ok && body?.success) setSlots(body.data!.slots);
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dayOfWeek, startTime, endTime, location }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not save.");
      return;
    }
    setTitle("");
    setLocation("");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this class slot?")) return;
    await fetch(`/api/timetable?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="grid gap-3 border-b border-border pb-6 sm:grid-cols-2">
        <FormField id="title" label="Class / activity">
          <input id="title" className="field-input" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField id="day" label="Day">
          <select id="day" className="field-input" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
            {DAYS.map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
        </FormField>
        <FormField id="start" label="Start">
          <input id="start" type="time" className="field-input" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </FormField>
        <FormField id="end" label="End">
          <input id="end" type="time" className="field-input" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </FormField>
        <FormField id="location" label="Room (optional)">
          <input id="location" className="field-input" value={location} onChange={(e) => setLocation(e.target.value)} />
        </FormField>
        <div className="flex items-end">
          <Button type="submit">Add to timetable</Button>
        </div>
      </form>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <div className="space-y-3">
        {DAYS.map((day, i) => {
          const daySlots = slots.filter((s) => s.dayOfWeek === i);
          if (daySlots.length === 0) return null;
          return (
            <section key={day} className="border-t border-border pt-4">
              <h3 className="mb-2 text-sm font-semibold">{day}</h3>
              <ul className="space-y-2 text-sm">
                {daySlots.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2">
                    <span>
                      <span className="font-medium">{s.title}</span>
                      <span className="text-muted"> · {s.startTime}–{s.endTime}</span>
                      {s.location ? <span className="text-muted"> · {s.location}</span> : null}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => void remove(s.id)}>Remove</Button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
