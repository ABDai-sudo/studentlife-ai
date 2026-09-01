"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";

type ModeId =
  | "professional"
  | "friendly"
  | "campusBro"
  | "chronicallyOnline"
  | "academicVillain";

type ModePreview = {
  id: ModeId;
  label: string;
  nav: [string, string, string, string, string];
  greeting: string;
  notice?: string;
};

const modes: ModePreview[] = [
  {
    id: "professional",
    label: "Professional",
    nav: ["Assignments", "Start Studying", "Upcoming Deadlines", "Progress", "Budget"],
    greeting: "Welcome back. Here is your plan for today.",
  },
  {
    id: "friendly",
    label: "Friendly",
    nav: ["Homework", "Study Time", "Coming Up", "Progress", "Budget"],
    greeting: "Hey there! Here's a friendly look at your day.",
  },
  {
    id: "campusBro",
    label: "Campus Bro",
    nav: ["Homework", "Lock In", "Due Soon", "Stats", "Budget"],
    greeting: "What's good? Here's the game plan.",
  },
  {
    id: "chronicallyOnline",
    label: "Chronically Online",
    nav: [
      "Academic Jump Scares",
      "Lock In",
      "Incoming Damage",
      "Academic Comeback Arc",
      "Financial Damage",
    ],
    greeting: "you're online. here's today's patch notes.",
    notice: "You are not fully cooked yet. Complete these two tasks first.",
  },
  {
    id: "academicVillain",
    label: "Academic Villain",
    nav: ["Contracts", "Begin Domination", "War Calendar", "Dominance", "Treasury"],
    greeting: "The board is set. Review your moves for today.",
  },
];

export function PersonalityModesSection() {
  const [active, setActive] = useState<ModeId>("professional");
  const current = modes.find((m) => m.id === active) ?? modes[0];

  return (
    <section id="personality" className="section-y-compact border-b border-border bg-surface">
      <div className="container-shell">
        <SectionHeader
          eyebrow="Personality Modes"
          title="Choose how the app talks to you"
          description="Switch how StudentLife AI talks to you. Privacy, security, account, and payment messages always stay professional."
          className="mb-8"
        />

        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Personality modes">
          {modes.map((mode) => {
            const selected = mode.id === active;
            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(mode.id)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  selected
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-background text-secondary hover:bg-surface-secondary hover:text-foreground"
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        <div
          key={current.id}
          className="card-elevated personality-preview overflow-hidden"
          role="tabpanel"
          aria-label={`${current.label} preview`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Dashboard labels · {current.label}
            </p>
            <Badge tone="neutral">Interactive preview</Badge>
          </div>

          <div className="grid gap-0 md:grid-cols-[11rem_1fr]">
            <aside className="space-y-1 border-b border-border bg-surface-secondary/50 p-3 md:border-b-0 md:border-r">
              {current.nav.map((item) => (
                <div
                  key={item}
                  className="rounded-lg px-2.5 py-2 text-xs font-medium text-foreground transition-colors"
                >
                  {item}
                </div>
              ))}
            </aside>

            <div className="space-y-3 p-4">
              <p className="text-sm leading-relaxed text-secondary">{current.greeting}</p>
              {current.notice ? (
                <div className="rounded-lg border border-border bg-surface-secondary px-3.5 py-3 text-sm text-foreground">
                  {current.notice}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-secondary">
                  Two tasks due today · one quiz unlocks +40 XP
                </div>
              )}
              <div className="rounded-xl border border-border bg-background px-3.5 py-3">
                <p className="text-xs font-semibold text-muted">Always professional</p>
                <p className="mt-1 text-sm text-secondary">
                  Privacy, security, account deletion, and payment notices never
                  switch personality tone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
