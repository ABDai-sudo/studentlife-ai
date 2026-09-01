"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { StatCard } from "@/components/ui/StatCard";
import { mountFetch } from "@/lib/react/mount-fetch";

type Progress = {
  subjects: number;
  notes: number;
  timetableSlots: number;
  pendingAssignments: number;
  attendanceRate: number | null;
  cgpa: number | null;
  upcomingExams: { id: string; title: string; subject: string; examDate: string }[];
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function ProgressClient() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(todayIso);
  const [status, setStatus] = useState("PRESENT");
  const [semester, setSemester] = useState("1");
  const [cgpaSubject, setCgpaSubject] = useState("");
  const [credits, setCredits] = useState("3");
  const [grade, setGrade] = useState("A");
  const [gradePoint, setGradePoint] = useState("9");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/progress", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) setProgress(json.data.progress);
  }, []);

  useEffect(() => {
    return mountFetch("/api/progress", ({ ok, json }) => {
      const body = json as {
        success?: boolean;
        data?: { progress: Progress };
      } | null;
      if (ok && body?.success) setProgress(body.data!.progress);
    });
  }, []);

  async function saveAttendance(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "attendance", subject, date, status }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not save attendance.");
      return;
    }
    setSubject("");
    await load();
  }

  async function saveCgpa(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "cgpa",
        semester: Number(semester),
        subject: cgpaSubject,
        credits: Number(credits),
        grade,
        gradePoint: Number(gradePoint),
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not save CGPA entry.");
      return;
    }
    setCgpaSubject("");
    await load();
  }

  return (
    <div className="space-y-5">
      {progress ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Subjects" value={String(progress.subjects)} />
          <StatCard label="Pending assignments" value={String(progress.pendingAssignments)} />
          <StatCard
            label="Attendance"
            value={progress.attendanceRate == null ? "—" : `${progress.attendanceRate}%`}
          />
          <StatCard
            label="CGPA"
            value={progress.cgpa == null ? "—" : String(progress.cgpa)}
          />
        </div>
      ) : null}

      {progress?.upcomingExams?.length ? (
        <section className="border-t border-border pt-6">
          <h3 className="mb-3 text-sm font-semibold">Upcoming exams</h3>
          <ul className="space-y-2 text-sm">
            {progress.upcomingExams.map((e) => (
              <li key={e.id} className="flex justify-between gap-2">
                <span>{e.title} · {e.subject}</span>
                <span className="text-muted">{e.examDate}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <form onSubmit={saveAttendance} className="grid gap-3 border-t border-border pt-6 sm:grid-cols-3">
        <h3 className="sm:col-span-3 text-sm font-semibold">Log attendance</h3>
        <FormField id="asubject" label="Subject">
          <input id="asubject" className="field-input" required value={subject} onChange={(e) => setSubject(e.target.value)} />
        </FormField>
        <FormField id="adate" label="Date">
          <input id="adate" type="date" className="field-input" required value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
        <FormField id="astatus" label="Status">
          <select id="astatus" className="field-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="EXCUSED">Excused</option>
          </select>
        </FormField>
        <div className="sm:col-span-3">
          <Button type="submit" size="sm">Save attendance</Button>
        </div>
      </form>

      <form onSubmit={saveCgpa} className="grid gap-3 border-t border-border pt-6 sm:grid-cols-3">
        <h3 className="sm:col-span-3 text-sm font-semibold">Add CGPA entry</h3>
        <FormField id="sem" label="Semester">
          <input id="sem" type="number" min={1} className="field-input" required value={semester} onChange={(e) => setSemester(e.target.value)} />
        </FormField>
        <FormField id="csubject" label="Subject">
          <input id="csubject" className="field-input" required value={cgpaSubject} onChange={(e) => setCgpaSubject(e.target.value)} />
        </FormField>
        <FormField id="credits" label="Credits">
          <input id="credits" type="number" step="0.5" className="field-input" required value={credits} onChange={(e) => setCredits(e.target.value)} />
        </FormField>
        <FormField id="grade" label="Grade">
          <input id="grade" className="field-input" required value={grade} onChange={(e) => setGrade(e.target.value)} />
        </FormField>
        <FormField id="gp" label="Grade point">
          <input id="gp" type="number" step="0.1" className="field-input" required value={gradePoint} onChange={(e) => setGradePoint(e.target.value)} />
        </FormField>
        <div className="flex items-end">
          <Button type="submit" size="sm">Add grade</Button>
        </div>
      </form>

      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
