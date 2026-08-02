"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";

const tabs = [
  "Subjects",
  "Notes",
  "Assignments",
  "Timetable",
  "Exams",
  "Attendance",
] as const;

type Tab = (typeof tabs)[number];

export function AcademicWorkspaceTabs() {
  const [active, setActive] = useState<Tab>("Subjects");

  return (
    <section id="workspace" className="section-y border-b border-border bg-background">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Academic workspace"
          title="Switch modules without losing context"
          description="Each tab opens a realistic view of how students actually work through a semester."
          className="mb-8"
        />

        <div
          className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1"
          role="tablist"
          aria-label="Academic workspace"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active === tab}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                active === tab
                  ? "bg-primary-soft text-primary"
                  : "text-secondary hover:text-foreground"
              }`}
              onClick={() => setActive(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4 card-elevated p-5 sm:p-6" role="tabpanel">
          {active === "Subjects" && <SubjectsView />}
          {active === "Notes" && <NotesView />}
          {active === "Assignments" && <AssignmentsView />}
          {active === "Timetable" && <TimetableView />}
          {active === "Exams" && <ExamsView />}
          {active === "Attendance" && <AttendanceView />}
        </div>
      </div>
    </section>
  );
}

function SubjectsView() {
  return (
    <div className="space-y-3">
      {[
        ["Computer Networks", "CSE301", 78, 86],
        ["Operating Systems", "CSE302", 64, 91],
        ["Database Systems", "CSE303", 71, 82],
      ].map(([name, code, progress, attendance]) => (
        <div
          key={String(name)}
          className="rounded-xl border border-border bg-background p-4"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground">{name}</p>
              <p className="text-xs text-muted">{code}</p>
            </div>
            <Badge tone="primary">{attendance}% attendance</Badge>
          </div>
          <ProgressBar value={Number(progress)} label="Syllabus coverage" />
        </div>
      ))}
    </div>
  );
}

function NotesView() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[
        ["Normalization forms", "DBMS · Updated yesterday"],
        ["TCP congestion control", "Networks · Updated Mon"],
        ["CPU scheduling", "OS · Updated Sun"],
        ["ER diagram checklist", "DBMS · Updated Fri"],
      ].map(([title, meta]) => (
        <div key={title} className="rounded-xl border border-border bg-background p-4">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted">{meta}</p>
          <p className="mt-3 text-sm leading-relaxed text-secondary">
            Key points, definitions, and one worked example ready for revision.
          </p>
        </div>
      ))}
    </div>
  );
}

function AssignmentsView() {
  return (
    <div className="space-y-2.5">
      {[
        ["DBMS project draft", "In progress", "Fri 5:00 PM"],
        ["Networks quiz prep", "Pending", "Mon 10:00 AM"],
        ["OS lab report", "Submitted", "Wed 11:59 PM"],
      ].map(([title, status, due]) => (
        <div
          key={title}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
        >
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted">Due {due}</p>
          </div>
          <Badge
            tone={
              status === "Submitted"
                ? "success"
                : status === "In progress"
                  ? "primary"
                  : "warning"
            }
          >
            {status}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function TimetableView() {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {[
        ["Thu 10:00", "Algorithms", "Room 204"],
        ["Thu 14:00", "Database Lab", "Lab B"],
        ["Fri 09:00", "Computer Networks", "Hall A"],
        ["Fri 13:00", "Tutorial", "Room 118"],
        ["Mon 11:00", "Operating Systems", "Room 210"],
        ["Tue 15:00", "Seminar", "Auditorium"],
      ].map(([time, title, place]) => (
        <div key={time} className="rounded-xl border border-border bg-background p-3">
          <p className="text-xs font-semibold text-primary">{time}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted">{place}</p>
        </div>
      ))}
    </div>
  );
}

function ExamsView() {
  return (
    <div className="space-y-3">
      {[
        ["Networks midterm", "12 Aug", "9 days"],
        ["OS quiz", "18 Aug", "15 days"],
        ["DBMS final", "02 Sep", "30 days"],
      ].map(([title, date, left]) => (
        <div
          key={title}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
        >
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted">{date}</p>
          </div>
          <Badge tone="warning">{left} left</Badge>
        </div>
      ))}
    </div>
  );
}

function AttendanceView() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ["Computer Networks", 86],
        ["Operating Systems", 91],
        ["Database Systems", 82],
      ].map(([name, value]) => (
        <div key={String(name)} className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {value}%
          </p>
          <p className="mt-1 text-xs text-muted">Required minimum 75%</p>
        </div>
      ))}
    </div>
  );
}
