"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/admin/ui";
import { mountFetch } from "@/lib/react/mount-fetch";

type ReportRow = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reporter: {
    id: string;
    email: string;
    status: string;
    displayName: string;
  };
};

type ReportDetail = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  resolutionNote: string | null;
  reporter: {
    id: string;
    email: string;
    status: string;
    displayName: string;
  };
  reviewedBy: { id: string; email: string; name: string | null } | null;
  target: {
    kind: string;
    summary: string;
    user?: { id: string; email: string; status: string; displayName: string };
    group?: { id: string; name: string; memberCount: number };
    snippet?: string | null;
  };
};

export default function AdminModerationPage() {
  const [status, setStatus] = useState("OPEN");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReportDetail | null>(null);
  const [note, setNote] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      status,
      page: String(page),
      pageSize: "20",
    });
    const res = await fetch(`/api/admin/campus-reports?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      setError("Unable to load reports");
      return;
    }
    const json = await res.json();
    setReports(json.data.reports);
    setTotal(json.data.total);
    setOpenCount(json.data.openCount);
    setError(null);
  }, [status, page]);

  useEffect(() => {
    const params = new URLSearchParams({
      status,
      page: String(page),
      pageSize: "20",
    });
    return mountFetch(`/api/admin/campus-reports?${params}`, ({ ok, json }) => {
      if (!ok) {
        setError("Unable to load reports");
        return;
      }
      const body = json as {
        data?: { reports: ReportRow[]; total: number; openCount: number };
      } | null;
      setReports(body?.data?.reports ?? []);
      setTotal(body?.data?.total ?? 0);
      setOpenCount(body?.data?.openCount ?? 0);
      setError(null);
    });
  }, [status, page]);

  async function openDetail(id: string) {
    setActionMsg(null);
    const res = await fetch(`/api/admin/campus-reports?id=${id}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      setActionMsg("Could not load report details.");
      return;
    }
    const json = await res.json();
    setSelected(json.data as ReportDetail);
    setNote((json.data as ReportDetail).resolutionNote ?? "");
  }

  async function resolve(next: "REVIEWED" | "DISMISSED" | "OPEN") {
    if (!selected) return;
    setActionMsg(null);
    const res = await fetch("/api/admin/campus-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selected.id,
        status: next,
        note: note.trim() || undefined,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setActionMsg(json?.error?.message || "Could not update report.");
      return;
    }
    setActionMsg(`Marked ${next.toLowerCase()}.`);
    await openDetail(selected.id);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Campus reports
        </h1>
        <p className="mt-1 text-sm text-muted">
          Owner-only inbox for Campus Circle reports. Students cannot access
          this page. Resolution never auto-deletes student academic or money data.
        </p>
        <p className="mt-2 text-xs text-muted">{openCount} open</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["OPEN", "REVIEWED", "DISMISSED", "ALL"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setStatus(value);
              setPage(1);
            }}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              status === value
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-secondary"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-secondary text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Reporter</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-border last:border-b-0 hover:bg-surface-secondary"
                  onClick={() => void openDetail(row.id)}
                >
                  <td className="px-3 py-2 text-muted">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{row.reason}</td>
                  <td className="px-3 py-2">
                    {row.targetType}
                  </td>
                  <td className="px-3 py-2">{row.reporter.displayName}</td>
                  <td className="px-3 py-2">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No reports"
                body="Open Campus Circle reports will appear here for owner review."
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-border p-4">
          {!selected ? (
            <p className="text-sm text-muted">Select a report to review.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-foreground">
                {selected.reason} · {selected.status}
              </p>
              <p className="text-muted">{selected.target.summary}</p>
              {selected.target.user ? (
                <p>
                  Reported student: {selected.target.user.displayName} (
                  {selected.target.user.email}) · {selected.target.user.status}
                </p>
              ) : null}
              {selected.target.group ? (
                <p>
                  Group: {selected.target.group.name} (
                  {selected.target.group.memberCount} members)
                </p>
              ) : null}
              {selected.target.snippet ? (
                <p className="rounded-lg bg-surface-secondary p-2 text-xs">
                  {selected.target.snippet}
                </p>
              ) : null}
              <p>
                Reporter: {selected.reporter.displayName} (
                {selected.reporter.email})
              </p>
              {selected.details ? (
                <p className="whitespace-pre-wrap text-xs text-muted">
                  {selected.details}
                </p>
              ) : null}
              <label className="block text-xs font-medium text-muted">
                Internal resolution note
                <textarea
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
                  rows={3}
                  maxLength={2000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm text-white"
                  onClick={() => void resolve("REVIEWED")}
                >
                  Mark reviewed
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm"
                  onClick={() => void resolve("DISMISSED")}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm"
                  onClick={() => void resolve("OPEN")}
                >
                  Reopen
                </button>
              </div>
              {actionMsg ? (
                <p className="text-xs text-muted">{actionMsg}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {total > 20 ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page * 20 >= total}
            className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
