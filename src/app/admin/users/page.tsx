"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/admin/ui";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  lastActiveAt: string | null;
  lastLoginAt: string | null;
  failedLoginCount: number;
  activeSessions: number;
  featureSummary: { expenses: number; assignments: number };
};

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      q,
      role,
      status,
      page: String(page),
      pageSize: "20",
    });
    const res = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
    if (!res.ok) {
      setError("Unable to load users");
      return;
    }
    const json = await res.json();
    setUsers(json.data.users);
    setTotal(json.data.total);
    setError(null);
  }, [q, role, status, page]);

  useEffect(() => {
    // Initial + dependency-driven fetch for admin user list
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional remote data load
    void load();
  }, [load]);

  async function runAction(
    action: "suspend" | "reactivate" | "revoke_sessions" | "reset_failed_logins"
  ) {
    if (!selected) return;
    setActionMsg(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selected.id,
        action,
        password,
        confirm: action === "suspend" ? confirm : undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionMsg(json?.error?.message || "Action failed");
      return;
    }
    setActionMsg("Action completed");
    setPassword("");
    setConfirm("");
    void load();
  }

  if (error) return <EmptyState title="Users" body={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-muted">
          Operational metadata only — no passwords, tokens, or private content.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Search name or email"
          className="min-h-11 min-w-[200px] flex-1 rounded-lg border border-border bg-surface px-3 text-sm"
        />
        <select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
          className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="ALL">All roles</option>
          <option value="USER">USER</option>
          <option value="OWNER">OWNER</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="DISABLED">DISABLED</option>
        </select>
        <a
          href={`/api/admin/users?export=csv&role=${role}&status=${status}&q=${encodeURIComponent(q)}`}
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium"
        >
          Export CSV
        </a>
      </div>
      <div className="card-surface overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Last active</th>
              <th className="px-3 py-3">Sessions</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-muted">
                  No users match these filters.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-border/70">
                  <td className="px-3 py-3">
                    <div className="font-medium">{u.name || "—"}</div>
                    <div className="text-xs text-muted">{u.email}</div>
                  </td>
                  <td className="px-3 py-3">{u.role}</td>
                  <td className="px-3 py-3">{u.status}</td>
                  <td className="px-3 py-3 text-xs">
                    {u.lastActiveAt
                      ? new Date(u.lastActiveAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-3 py-3">{u.activeSessions}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setSelected(u)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">
          Page {page} · {total} total
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="min-h-11 rounded-lg border border-border px-3 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page * 20 >= total}
            className="min-h-11 rounded-lg border border-border px-3 disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {selected.name || "User"}
                </h2>
                <p className="text-sm text-muted">{selected.email}</p>
              </div>
              <button
                type="button"
                className="text-sm text-muted"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted">Role</dt>
                <dd>{selected.role}</dd>
              </div>
              <div>
                <dt className="text-muted">Status</dt>
                <dd>{selected.status}</dd>
              </div>
              <div>
                <dt className="text-muted">Email verified</dt>
                <dd>{selected.emailVerified ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-muted">Failed logins</dt>
                <dd>{selected.failedLoginCount}</dd>
              </div>
              <div>
                <dt className="text-muted">Created</dt>
                <dd>{new Date(selected.createdAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-muted">Feature usage</dt>
                <dd>
                  {selected.featureSummary.expenses} expenses ·{" "}
                  {selected.featureSummary.assignments} assignments
                </dd>
              </div>
            </dl>
            <div className="mt-5 space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium">
                Sensitive actions require your password
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Re-enter owner password"
                className="min-h-11 w-full rounded-lg border border-border px-3 text-sm"
                autoComplete="current-password"
              />
              {selected.status !== "SUSPENDED" && (
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Type SUSPEND to confirm suspension"
                  className="min-h-11 w-full rounded-lg border border-border px-3 text-sm"
                />
              )}
              <div className="flex flex-wrap gap-2">
                {selected.status !== "SUSPENDED" ? (
                  <button
                    type="button"
                    className="min-h-11 rounded-lg bg-rose-600 px-3 text-sm font-medium text-white"
                    onClick={() => void runAction("suspend")}
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    type="button"
                    className="min-h-11 rounded-lg bg-primary px-3 text-sm font-medium text-white"
                    onClick={() => void runAction("reactivate")}
                  >
                    Reactivate
                  </button>
                )}
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-border px-3 text-sm"
                  onClick={() => void runAction("revoke_sessions")}
                >
                  Revoke sessions
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-border px-3 text-sm"
                  onClick={() => void runAction("reset_failed_logins")}
                >
                  Reset failed logins
                </button>
              </div>
              {actionMsg && <p className="text-sm text-muted">{actionMsg}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
