"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, StatusPill } from "@/components/admin/ui";

type LivePayload = {
  available: boolean;
  message?: string;
  approximateActiveUsers: number;
  apiHealth: string;
  suspiciousLoginBursts: boolean;
  recentSignups: Array<{ id: string; email: string; createdAt: string }>;
  recentLogins: Array<{ userId: string | null; createdAt: string }>;
  recentFeatures: Array<{ eventName: string; createdAt: string }>;
  recentErrors: Array<{
    id: string;
    route: string | null;
    errorCode: string;
    messageSafe: string;
    createdAt: string;
  }>;
};

export default function AdminLivePage() {
  const [data, setData] = useState<LivePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live", { cache: "no-store" });
      if (res.status === 403 || res.status === 401) {
        setError("Access denied");
        return;
      }
      const json = await res.json();
      setData(json.data as LivePayload);
      setError(null);
    } catch {
      setError("Could not load live activity");
    }
  }, []);

  useEffect(() => {
    // Poll live activity endpoint
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional remote data load
    void load();
    const id = setInterval(() => void load(), 20000);
    return () => clearInterval(id);
  }, [load]);

  if (error) return <EmptyState title="Live activity" body={error} />;
  if (!data) {
    return (
      <div className="card-surface animate-pulse p-8 text-sm text-muted">
        Loading live activity…
      </div>
    );
  }
  if (!data.available) {
    return (
      <EmptyState
        title="Live activity unavailable"
        body={data.message || "Database may be offline."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Live Activity</h1>
          <p className="mt-1 text-sm text-muted">
            Approximate signals · refreshes every 20s · no private content
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="min-h-11 rounded-lg border border-border bg-surface px-4 text-sm font-medium"
        >
          Refresh
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-xs uppercase text-muted">Approx. active</p>
          <p className="mt-2 text-2xl font-semibold">
            {data.approximateActiveUsers}
          </p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs uppercase text-muted">API health</p>
          <div className="mt-2">
            <StatusPill status={data.apiHealth} />
          </div>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs uppercase text-muted">Login burst watch</p>
          <p className="mt-2 text-sm font-medium">
            {data.suspiciousLoginBursts
              ? "Elevated failed logins (5m)"
              : "Normal"}
          </p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Feed
          title="Recent signups"
          items={data.recentSignups.map(
            (s) => `${s.email} · ${new Date(s.createdAt).toLocaleString()}`
          )}
        />
        <Feed
          title="Recent logins"
          items={data.recentLogins.map(
            (l) =>
              `${l.userId ? l.userId.slice(0, 8) : "user"}… · ${new Date(l.createdAt).toLocaleString()}`
          )}
        />
        <Feed
          title="Feature events"
          items={data.recentFeatures.map(
            (f) => `${f.eventName} · ${new Date(f.createdAt).toLocaleString()}`
          )}
        />
        <Feed
          title="Recent errors"
          items={data.recentErrors.map(
            (e) => `${e.errorCode} · ${e.route || "—"} · ${e.messageSafe}`
          )}
        />
      </div>
    </div>
  );
}

function Feed({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card-surface p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing in the last 15 minutes.</p>
      ) : (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm text-secondary">
          {items.map((item, i) => (
            <li key={`${title}-${i}`} className="border-b border-border/60 pb-2">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
