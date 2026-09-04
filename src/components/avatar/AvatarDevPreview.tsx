"use client";

import type { BudgetState } from "@/lib/avatar/budget-state";

export type AvatarDevOverrides = {
  budget: BudgetState;
  examSeasonActive: boolean;
  campusSlang: boolean;
  broMode: boolean;
  forceStatic: boolean;
  force3dFailure: boolean;
};

const BUDGETS: BudgetState[] = ["rich", "mid", "cooked"];

export function AvatarDevPreview({
  live,
  value,
  onChange,
}: {
  live: AvatarDevOverrides;
  value: AvatarDevOverrides | null;
  onChange: (next: AvatarDevOverrides | null) => void;
}) {
  if (process.env.NODE_ENV !== "development") return null;

  const active = value ?? live;

  return (
    <details className="avatar-dev-preview mt-4">
      <summary className="cursor-pointer text-xs font-medium text-muted">
        Avatar preview (dev)
      </summary>
      <div className="mt-3 grid gap-2 text-xs text-secondary sm:grid-cols-2">
        <label className="flex items-center gap-2">
          Budget
          <select
            className="rounded-md border border-border bg-surface px-2 py-1 text-foreground"
            value={active.budget}
            onChange={(event) =>
              onChange({
                ...active,
                budget: event.target.value as BudgetState,
              })
            }
          >
            {BUDGETS.map((band) => (
              <option key={band} value={band}>
                {band}
              </option>
            ))}
          </select>
        </label>
        <Toggle
          label="Exam season"
          checked={active.examSeasonActive}
          onChange={(examSeasonActive) =>
            onChange({ ...active, examSeasonActive })
          }
        />
        <Toggle
          label="Campus slang"
          checked={active.campusSlang}
          onChange={(campusSlang) => onChange({ ...active, campusSlang })}
        />
        <Toggle
          label="Bro mode"
          checked={active.broMode}
          onChange={(broMode) => onChange({ ...active, broMode })}
        />
        <Toggle
          label="Image fallback"
          checked={active.forceStatic}
          onChange={(forceStatic) => onChange({ ...active, forceStatic })}
        />
        <Toggle
          label="Simulate 3D failure"
          checked={active.force3dFailure}
          onChange={(force3dFailure) => onChange({ ...active, force3dFailure })}
        />
      </div>
      <button
        type="button"
        className="mt-3 text-xs font-medium text-primary"
        onClick={() => onChange(null)}
      >
        Use live data
      </button>
    </details>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
