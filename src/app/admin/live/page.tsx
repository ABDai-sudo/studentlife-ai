"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, StatusPill } from "@/components/admin/ui";
import { fetchJson, mountFetch } from "@/lib/react/mount-fetch";

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
      const { status, json } = await fetchJson("/api/admin/live");
      if (status === 403 || status === 401) {
        setError("Access denied");
        return;
      }
      const body = json as { data?: LivePayload } | null;
      setData(body?.data as LivePayload);
      setError(null);
    } catch {
      setError("Could not load live activity");
    }
  }, []);

  useEffect(() => {
    const stop = mountFetch(
      "/api/admin/live",
      ({ status, json }) => {
        if (status === 403 || status === 401) {
          setError("Access denied");
          return;
        }
        const body = json as { data?: LivePayload } | null;
        setData(body?.data as LivePayload);
        setError(null);
      },
      () => {
        setError("Could not load live activity");
      }
    );
    const id = setInterval(() => {
      fetchJson("/api/admin/live")
        .then(({ status, json }) => {
          if (status === 403 || status === 401) {
            setError("Access denied");
            return;
          }
          const body = json as { data?: LivePayload } | null;
          setData(body?.data as LivePayload);
          setError(null);
        })
        .catch(() => {
          setError("Could not load live activity");
        });
    }, 20000);
    return () => {
      stop();
      clearInterval(id);
    };
  }, []);

  if (error) return <EmptyState title="Live activity" body={error} />;
  if (!data) {
    return (
      <div className="animate-pulse py-8 text-sm text-muted">
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
        <div className="border-t border-border pt-4">
          <p className="text-xs uppercase text-muted">Approx. active</p>
          <p className="mt-2 text-2xl font-semibold">
            {data.approximateActiveUsers}
          </p>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-xs uppercase text-muted">API health</p>
          <div className="mt-2">
            <StatusPill status={data.apiHealth} />
          </div>
        </div>
        <div className="border-t border-border pt-4">
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
    <div className="border-t border-border pt-4">
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
