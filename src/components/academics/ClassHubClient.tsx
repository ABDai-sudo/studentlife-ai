"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { mountFetch } from "@/lib/react/mount-fetch";

type Membership = {
  hub: {
    id: string;
    name: string;
    institution: string;
    course: string;
    semester: string;
    inviteCode: string;
    _count: { members: number; announcements: number };
  };
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  verified: boolean;
  createdAt: string;
  author: { name: string | null };
};

export function ClassHubClient() {
  const [enabled, setEnabled] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [hubId, setHubId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    institution: "",
    course: "",
    semester: "",
    inviteCode: "",
  });
  const [announce, setAnnounce] = useState({ title: "", body: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/class-hub", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not load Class Hub.");
      return;
    }
    setEnabled(json.data.enabled !== false);
    setMemberships(json.data.memberships || []);
    if (json.data.memberships?.[0]?.hub?.id) {
      setHubId(json.data.memberships[0].hub.id);
    }
  }, []);

  useEffect(() => {
    return mountFetch("/api/class-hub", ({ ok, json }) => {
      const body = json as {
        success?: boolean;
        data?: {
          enabled?: boolean;
          memberships?: Membership[];
        };
        error?: { message?: string };
      } | null;
      if (!ok || !body?.success) {
        setError(body?.error?.message || "Could not load Class Hub.");
        return;
      }
      setEnabled(body.data!.enabled !== false);
      setMemberships(body.data!.memberships || []);
      if (body.data!.memberships?.[0]?.hub?.id) {
        setHubId(body.data!.memberships[0].hub.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!hubId) return;
    return mountFetch(`/api/class-hub?hubId=${hubId}`, ({ ok, json }) => {
      const body = json as { success?: boolean; data?: Announcement[] } | null;
      if (ok && body?.success) setAnnouncements(body.data!);
    });
  }, [hubId]);

  async function join(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/class-hub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "join",
        ...form,
        inviteCode: form.inviteCode || undefined,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message || "Could not join.");
      return;
    }
    await load();
  }

  if (!enabled) {
    return (
      <div className="border-t border-border py-5 text-sm text-secondary">
        Class Hub is currently disabled on this deployment.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <p className="text-sm text-secondary">
        Optional shared space for your institution, course, and semester.
        Announcements are user-submitted and unverified unless marked otherwise.
        Private tasks, budgets, chats, and grades are never shared here.
      </p>

      <form onSubmit={join} className="space-y-3 border-b border-border pb-6">
        <p className="text-sm font-semibold">Join or create a hub</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField id="institution" label="Institution">
            <input
              id="institution"
              className="field-input"
              required
              value={form.institution}
              onChange={(e) =>
                setForm({ ...form, institution: e.target.value })
              }
            />
          </FormField>
          <FormField id="course" label="Course">
            <input
              id="course"
              className="field-input"
              required
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
            />
          </FormField>
          <FormField id="semester" label="Semester / class">
            <input
              id="semester"
              className="field-input"
              required
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
            />
          </FormField>
        </div>
        <FormField id="invite" label="Invite code (optional)">
          <input
            id="invite"
            className="field-input"
            value={form.inviteCode}
            onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
          />
        </FormField>
        <Button type="submit">Join hub</Button>
      </form>

      {memberships.map((m) => (
        <div key={m.hub.id} className="space-y-3 border-t border-border pt-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold">{m.hub.name}</h2>
              <p className="text-sm text-secondary">
                {m.hub.institution} · {m.hub._count.members} members
              </p>
              <p className="mt-1 text-xs text-muted">
                Invite code: {m.hub.inviteCode}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={async () => {
                await fetch("/api/class-hub", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "leave", hubId: m.hub.id }),
                });
                await load();
              }}
            >
              Leave hub
            </Button>
          </div>

          {hubId === m.hub.id ? (
            <>
              <form
                className="space-y-2 border-t border-border pt-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await fetch("/api/class-hub", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "announce",
                      hubId: m.hub.id,
                      title: announce.title,
                      body: announce.body,
                    }),
                  });
                  setAnnounce({ title: "", body: "" });
                  const res = await fetch(`/api/class-hub?hubId=${m.hub.id}`);
                  const json = await res.json().catch(() => null);
                  if (res.ok && json?.success) setAnnouncements(json.data);
                }}
              >
                <p className="text-sm font-medium">Post announcement</p>
                <input
                  className="field-input"
                  placeholder="Title"
                  value={announce.title}
                  onChange={(e) =>
                    setAnnounce({ ...announce, title: e.target.value })
                  }
                  required
                />
                <textarea
                  className="field-input"
                  placeholder="Details"
                  value={announce.body}
                  onChange={(e) =>
                    setAnnounce({ ...announce, body: e.target.value })
                  }
                  required
                />
                <Button type="submit" size="sm">
                  Post (unverified)
                </Button>
              </form>
              <div className="space-y-2">
                {announcements.map((a) => (
                  <article
                    key={a.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{a.title}</h3>
                      <span className="text-[0.65rem] uppercase text-muted">
                        {a.verified ? "Verified" : "User-submitted"}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-secondary">
                      {a.body}
                    </p>
                    <div className="mt-2 flex justify-between text-xs text-muted">
                      <span>{a.author.name || "Student"}</span>
                      <button
                        type="button"
                        className="underline"
                        onClick={() =>
                          void fetch("/api/class-hub", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "report",
                              hubId: m.hub.id,
                              targetType: "announcement",
                              targetId: a.id,
                              reason: "Inappropriate or misleading",
                            }),
                          })
                        }
                      >
                        Report
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={() => setHubId(m.hub.id)}
            >
              Open
            </Button>
          )}
        </div>
      ))}

      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
