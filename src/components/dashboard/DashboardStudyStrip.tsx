"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { mountFetch } from "@/lib/react/mount-fetch";

type Summary = {
  xpTotal: number;
  level: number;
  levelName: string;
  academicAura: number;
  streak: { current: number; best: number };
};

export function DashboardStudyStrip() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    return mountFetch("/api/progress/gamification", ({ ok, json }) => {
      const body = json as { success?: boolean; data?: Summary } | null;
      if (ok && body?.success) setData(body.data!);
    });
  }, []);

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          Study streak & games
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button href="/dashboard/games" size="sm">
            Open Games & Streaks
          </Button>
          <Button href="/settings" size="sm" variant="secondary">
            Language & personality
          </Button>
        </div>
      </div>
      {data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Streak"
            value={`${data.streak.current}d`}
            hint={`Best ${data.streak.best}d`}
          />
          <StatCard label="XP" value={`${data.xpTotal}`} hint={data.levelName} />
          <StatCard label="Level" value={`${data.level}`} hint={data.levelName} />
          <StatCard
            label="Aura"
            value={`${data.academicAura}/100`}
            hint="Consistency"
          />
        </div>
      ) : (
        <p className="text-sm text-muted">
          Loading streak… If this stays empty, run{" "}
          <code className="text-xs">npx prisma db push</code> then refresh.
        </p>
      )}
    </div>
  );
}
