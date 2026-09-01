"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useTheme } from "@/components/theme/ThemeProvider";
import { getCopy } from "@/lib/personality";

type Block = { title: string; detail: string; minutes: number };
type Plan = {
  headline: string;
  now: Block[];
  next: Block[];
  later: Block[];
  breaks: string[];
  sleepReminder: string;
  addedSlots?: number;
};

function PlanSection({
  title,
  items,
}: {
  title: string;
  items: Block[];
}) {
  if (!items.length) return null;
  return (
    <section className="border-t border-border pt-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 divide-y divide-border">
        {items.map((item) => (
          <li key={item.title} className="py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{item.title}</p>
              <span className="text-xs text-muted">{item.minutes} min</span>
            </div>
            <p className="mt-1 text-sm text-secondary">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EmergencyPlanClient() {
  const { personality } = useTheme();
  const copy = getCopy(personality);
  const [hours, setHours] = useState("8");
  const [sleep, setSleep] = useState("7");
  const [addToTimetable, setAddToTimetable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/emergency-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availableHours: Number(hours),
          sleepHours: Number(sleep),
          addToTimetable,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || "Could not build plan.");
        return;
      }
      setPlan(json.data);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{copy.emergency.title}</h2>
          <p className="mt-1 text-sm text-secondary">
            Builds a realistic plan from your pending assignments and upcoming
            exams — with breaks and sleep protected.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="hours" label="Available study hours">
            <input
              id="hours"
              type="number"
              min={1}
              max={72}
              className="field-input"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </FormField>
          <FormField id="sleep" label="Sleep hours to protect">
            <input
              id="sleep"
              type="number"
              min={4}
              max={10}
              className="field-input"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
            />
          </FormField>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={addToTimetable}
            onChange={(e) => setAddToTimetable(e.target.checked)}
          />
          Add first blocks to timetable
        </label>
        <Button type="button" onClick={() => void generate()} disabled={loading}>
          {loading ? "Planning…" : copy.emergency.buttonLabel}
        </Button>
        {error ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {plan ? (
        <div className="space-y-3">
          <p className="text-sm text-secondary">
            {plan.headline}
          </p>
          <PlanSection title="Do now" items={plan.now} />
          <PlanSection title="Do next" items={plan.next} />
          <PlanSection title="Later" items={plan.later} />
          <div className="border-t border-border pt-4 text-sm text-secondary">
            <p className="font-medium text-foreground">Breaks & sleep</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {plan.breaks.map((b) => (
                <li key={b}>{b}</li>
              ))}
              <li>{plan.sleepReminder}</li>
            </ul>
            {plan.addedSlots != null ? (
              <p className="mt-3 text-xs text-muted">
                Added {plan.addedSlots} session(s) to your timetable.
              </p>
            ) : null}
            <div className="mt-4">
              <Button href="/dashboard/timetable" variant="secondary" size="sm">
                Open timetable
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
