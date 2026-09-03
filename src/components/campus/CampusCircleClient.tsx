"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/components/i18n/LocaleProvider";
import { mountFetch } from "@/lib/react/mount-fetch";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";
import type { CampusStudyStatusValue } from "@/lib/campus-circle/privacy";
import { CAMPUS_REPORT_REASONS } from "@/lib/campus-circle/privacy";

type StudentCard = {
  id: string;
  displayName: string;
  avatarPresetId: string | null;
  studyStatus: CampusStudyStatusValue | null;
};

type Reactions = {
  ENCOURAGE: number;
  THANKS: number;
  FOCUS: number;
  mine: string[];
};

type RecapPayload = {
  studyMinutes: number;
  tasksCompleted: number;
  quizzesCompleted: number;
  currentStreak: number;
};

type Overview = {
  enabled: boolean;
  me?: StudentCard;
  settings?: {
    studyStatus: CampusStudyStatusValue;
    shareStudyStatus: boolean;
    allowConnectionRequests: boolean;
    allowStudyInvites: boolean;
    allowQuizChallenges: boolean;
    allowGroupInvites: boolean;
  };
  connections?: { id: string; user: StudentCard }[];
  incomingRequests?: { id: string; user: StudentCard }[];
  outgoingRequests?: { id: string; user: StudentCard }[];
  studyInvites?: {
    incoming: { id: string; status: string; topic: string | null; user: StudentCard }[];
    outgoing: { id: string; status: string; topic: string | null; user: StudentCard }[];
  };
  quizChallenges?: {
    incoming: { id: string; status: string; user: StudentCard }[];
    outgoing: { id: string; status: string; user: StudentCard }[];
  };
  recapShares?: {
    preview: RecapPayload | null;
    incoming: {
      id: string;
      payload: RecapPayload;
      user: StudentCard;
      reactions: Reactions;
    }[];
    outgoing: {
      id: string;
      payload: RecapPayload;
      user: StudentCard;
      reactions: Reactions;
    }[];
  };
  groups?: {
    id: string;
    name: string;
    role: string;
    memberCount: number;
    activityCount: number;
    isOwner: boolean;
  }[];
  groupInvites?: {
    id: string;
    groupId: string;
    groupName: string;
    from: StudentCard;
  }[];
  blocked?: { id: string; user: StudentCard }[];
};

type GroupDetail = {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
  members: { role: string; user: StudentCard }[];
  activities: {
    id: string;
    kind: string;
    body: string;
    createdAt: string;
    author: StudentCard;
    reactions: Reactions;
  }[];
};

type Tab = "connections" | "invites" | "groups" | "privacy";

const STATUS_KEYS: Record<CampusStudyStatusValue, MessageKey> = {
  AVAILABLE: "circle.status.AVAILABLE",
  FOCUSING: "circle.status.FOCUSING",
  IN_SESSION: "circle.status.IN_SESSION",
  BREAK: "circle.status.BREAK",
  HIDDEN: "circle.status.HIDDEN",
};

const REASON_KEYS: { id: (typeof CAMPUS_REPORT_REASONS)[number]; key: MessageKey }[] = [
  { id: "harassment", key: "circle.reason.harassment" },
  { id: "spam", key: "circle.reason.spam" },
  { id: "inappropriate", key: "circle.reason.inappropriate" },
  { id: "impersonation", key: "circle.reason.impersonation" },
  { id: "other", key: "circle.reason.other" },
];

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted">{description}</span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 start-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

function Person({ user, extra }: { user: StudentCard; extra?: string }) {
  const { t } = useT();
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={user.displayName} presetId={user.avatarPresetId} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {user.displayName}
        </p>
        {user.studyStatus ? (
          <p className="truncate text-xs text-muted">
            {t(STATUS_KEYS[user.studyStatus])}
          </p>
        ) : extra ? (
          <p className="truncate text-xs text-muted">{extra}</p>
        ) : null}
      </div>
    </div>
  );
}

export function CampusCircleClient({
  enabled,
  initialData = null,
}: {
  enabled: boolean;
  initialData?: Overview | null;
}) {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>("connections");
  const [data, setData] = useState<Overview | null>(
    enabled ? initialData : { enabled: false }
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [groupName, setGroupName] = useState("");
  const [activityBody, setActivityBody] = useState("");
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);
  const [reportReason, setReportReason] =
    useState<(typeof CAMPUS_REPORT_REASONS)[number]>("inappropriate");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/campus-circle", {
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || t("circle.loadError"));
        return;
      }
      setData(json.data as Overview);
    } catch {
      setError(t("circle.loadError"));
    }
  }, [t]);

  useEffect(() => {
    if (!enabled || initialData) return;
    return mountFetch(
      "/api/campus-circle",
      ({ ok, json }) => {
        const body = json as {
          success?: boolean;
          data?: Overview;
          error?: { message?: string };
        } | null;
        if (!ok || !body?.success) {
          setError(body?.error?.message || t("circle.loadError"));
          return;
        }
        setError(null);
        setData(body.data ?? { enabled: false });
      },
      () => {
        setError(t("circle.loadError"));
      }
    );
  }, [enabled, initialData, t]);

  useEffect(() => {
    if (!enabled || !openGroupId) return;
    return mountFetch(`/api/campus-circle?groupId=${openGroupId}`, ({ ok, json }) => {
      const body = json as {
        success?: boolean;
        data?: GroupDetail;
        error?: { message?: string };
      } | null;
      if (!ok || !body?.success) {
        setError(body?.error?.message || t("circle.loadError"));
        return;
      }
      setGroupDetail(body.data ?? null);
    });
  }, [enabled, openGroupId, t]);

  async function act(body: Record<string, unknown>, okMessage?: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/campus-circle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message || t("circle.actionError"));
        return false;
      }
      if (okMessage) setMessage(okMessage);
      await load();
      if (openGroupId) {
        const gRes = await fetch(`/api/campus-circle?groupId=${openGroupId}`, {
          cache: "no-store",
        });
        const gJson = await gRes.json().catch(() => null);
        if (gRes.ok && gJson?.success) setGroupDetail(gJson.data);
      }
      return true;
    } finally {
      setBusy(false);
    }
  }

  if (!enabled || data?.enabled === false) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title={t("circle.disabled")}
          description={t("circle.disabledBody")}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        {error ? (
          <div className="space-y-3">
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
            <Button size="sm" variant="secondary" onClick={() => void load()}>
              {t("actions.retry")}
            </Button>
          </div>
        ) : (
          <>
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Button size="sm" variant="ghost" onClick={() => void load()}>
              {t("actions.retry")}
            </Button>
          </>
        )}
      </div>
    );
  }

  const tabs: { id: Tab; key: MessageKey }[] = [
    { id: "connections", key: "circle.tab.connections" },
    { id: "invites", key: "circle.tab.invites" },
    { id: "groups", key: "circle.tab.groups" },
    { id: "privacy", key: "circle.tab.privacy" },
  ];

  return (
    <div className="mx-auto max-w-3xl min-w-0 space-y-5">
      <p className="text-sm leading-relaxed text-secondary">
        {t("circle.privacyNote")}
      </p>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold ${
              tab === item.id
                ? "bg-primary-soft text-primary"
                : "text-secondary hover:bg-surface-secondary"
            }`}
          >
            {t(item.key)}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-success" role="status">
          {message}
        </p>
      ) : null}

      {tab === "connections" ? (
        <div className="space-y-6">
          <form
            className="space-y-3 rounded-xl border border-border p-4"
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              const ok = await act({ action: "connect", email }, t("circle.sent"));
              if (ok) setEmail("");
            }}
          >
            <h2 className="text-sm font-semibold">{t("circle.connectTitle")}</h2>
            <p className="text-xs text-muted">{t("circle.connectHint")}</p>
            <FormField id="circle-email" label={t("circle.connectEmail")}>
              <input
                id="circle-email"
                type="email"
                required
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </FormField>
            <Button type="submit" size="sm" disabled={busy}>
              {t("circle.sendRequest")}
            </Button>
          </form>

          {data.incomingRequests && data.incomingRequests.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("circle.pendingIn")}</h2>
              {data.incomingRequests.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"
                >
                  <Person user={row.user} />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void act({
                          action: "respond_connection",
                          connectionId: row.id,
                          accept: true,
                        })
                      }
                    >
                      {t("circle.accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        void act({
                          action: "respond_connection",
                          connectionId: row.id,
                          accept: false,
                        })
                      }
                    >
                      {t("circle.decline")}
                    </Button>
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          {data.outgoingRequests && data.outgoingRequests.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t("circle.pendingOut")}</h2>
              {data.outgoingRequests.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-border p-3"
                >
                  <Person user={row.user} extra={t("circle.outgoing")} />
                </div>
              ))}
            </section>
          ) : null}

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">{t("circle.yourConnections")}</h2>
            {!data.connections?.length ? (
              <EmptyState
                title={t("circle.noConnections")}
                description={t("circle.noConnectionsBody")}
              />
            ) : (
              data.connections.map((row) => (
                <article
                  key={row.id}
                  className="space-y-3 rounded-xl border border-border p-3"
                >
                  <Person user={row.user} />
                  <FormField
                    id={`topic-${row.user.id}`}
                    label={t("circle.inviteTopic")}
                  >
                    <input
                      id={`topic-${row.user.id}`}
                      className="field-input"
                      maxLength={80}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </FormField>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          {
                            action: "study_invite",
                            userId: row.user.id,
                            topic: topic || undefined,
                          },
                          t("circle.sent")
                        )
                      }
                    >
                      {t("circle.inviteStudy")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          { action: "quiz_challenge", userId: row.user.id },
                          t("circle.sent")
                        )
                      }
                    >
                      {t("circle.challengeQuiz")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          { action: "share_recap", userId: row.user.id },
                          t("circle.sent")
                        )
                      }
                    >
                      {t("circle.recapShare")}
                    </Button>
                    {data.groups?.length ? (
                      <select
                        className="field-input max-w-full"
                        defaultValue=""
                        disabled={busy}
                        onChange={(e) => {
                          const groupId = e.target.value;
                          e.target.value = "";
                          if (!groupId) return;
                          void act(
                            {
                              action: "invite_to_group",
                              groupId,
                              userId: row.user.id,
                            },
                            t("circle.sent")
                          );
                        }}
                      >
                        <option value="">{t("circle.inviteToGroup")}</option>
                        {data.groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        void act({
                          action: "remove_connection",
                          userId: row.user.id,
                        })
                      }
                    >
                      {t("circle.remove")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        void act({ action: "block", userId: row.user.id })
                      }
                    >
                      {t("circle.block")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        void act({
                          action: "report",
                          targetType: "USER",
                          targetId: row.user.id,
                          reason: reportReason,
                        })
                      }
                    >
                      {t("circle.report")}
                    </Button>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      ) : null}

      {tab === "invites" ? (
        <div className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">{t("circle.inviteStudy")}</h2>
            {!data.studyInvites?.incoming.filter((i) => i.status === "PENDING")
              .length &&
            !data.studyInvites?.outgoing.filter((i) => i.status === "PENDING")
              .length ? (
              <p className="text-sm text-muted">{t("circle.emptyInvites")}</p>
            ) : null}
            {data.studyInvites?.incoming
              .filter((i) => i.status === "PENDING")
              .map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"
                >
                  <Person user={row.user} extra={row.topic || t("circle.incoming")} />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void act({
                          action: "respond_study_invite",
                          inviteId: row.id,
                          accept: true,
                        })
                      }
                    >
                      {t("circle.accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        void act({
                          action: "respond_study_invite",
                          inviteId: row.id,
                          accept: false,
                        })
                      }
                    >
                      {t("circle.decline")}
                    </Button>
                  </div>
                </div>
              ))}
            {data.studyInvites?.outgoing
              .filter((i) => i.status === "PENDING")
              .map((row) => (
                <div key={row.id} className="rounded-xl border border-border p-3">
                  <Person user={row.user} extra={row.topic || t("circle.outgoing")} />
                </div>
              ))}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">{t("circle.challengeQuiz")}</h2>
            {data.quizChallenges?.incoming
              .filter((i) => i.status === "PENDING")
              .map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"
                >
                  <Person user={row.user} />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void act({
                          action: "respond_quiz_challenge",
                          challengeId: row.id,
                          accept: true,
                        })
                      }
                    >
                      {t("circle.accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        void act({
                          action: "respond_quiz_challenge",
                          challengeId: row.id,
                          accept: false,
                        })
                      }
                    >
                      {t("circle.decline")}
                    </Button>
                  </div>
                </div>
              ))}
            {data.quizChallenges?.outgoing
              .filter((i) => i.status === "PENDING")
              .map((row) => (
                <div key={row.id} className="rounded-xl border border-border p-3">
                  <Person user={row.user} extra={t("circle.outgoing")} />
                </div>
              ))}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">{t("circle.recapShare")}</h2>
            <p className="text-xs text-muted">{t("circle.recapShareHint")}</p>
            {data.recapShares?.preview ? (
              <p className="text-sm text-secondary">
                {data.recapShares.preview.studyMinutes} min ·{" "}
                {data.recapShares.preview.tasksCompleted} ·{" "}
                {data.recapShares.preview.currentStreak}
              </p>
            ) : (
              <p className="text-sm text-muted">{t("circle.recapNone")}</p>
            )}
            {[
              ...(data.recapShares?.incoming ?? []).map((row) => ({
                ...row,
                label: t("circle.sharedFrom", { name: row.user.displayName }),
              })),
              ...(data.recapShares?.outgoing ?? []).map((row) => ({
                ...row,
                label: t("circle.sharedWith", { name: row.user.displayName }),
              })),
            ].map((row) => (
              <article key={row.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium">{row.label}</p>
                <p className="mt-1 text-sm text-secondary">
                  {row.payload.studyMinutes} min · {row.payload.tasksCompleted} ·{" "}
                  {row.payload.quizzesCompleted} · {row.payload.currentStreak}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["ENCOURAGE", "THANKS", "FOCUS"] as const).map((kind) => (
                    <Button
                      key={kind}
                      size="sm"
                      variant={row.reactions.mine.includes(kind) ? "primary" : "secondary"}
                      disabled={busy}
                      onClick={() =>
                        void act({
                          action: "react",
                          targetType: "SHARE",
                          targetId: row.id,
                          kind,
                        })
                      }
                    >
                      {t(
                        kind === "ENCOURAGE"
                          ? "circle.react.encourage"
                          : kind === "THANKS"
                            ? "circle.react.thanks"
                            : "circle.react.focus"
                      )}{" "}
                      {row.reactions[kind] || ""}
                    </Button>
                  ))}
                </div>
              </article>
            ))}
          </section>
        </div>
      ) : null}

      {tab === "groups" ? (
        <div className="space-y-6">
          <form
            className="space-y-3 rounded-xl border border-border p-4"
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              const ok = await act(
                { action: "create_group", name: groupName },
                t("circle.saved")
              );
              if (ok) setGroupName("");
            }}
          >
            <h2 className="text-sm font-semibold">{t("circle.groupsTitle")}</h2>
            <FormField id="group-name" label={t("circle.groupName")}>
              <input
                id="group-name"
                required
                minLength={2}
                maxLength={80}
                className="field-input"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </FormField>
            <Button type="submit" size="sm" disabled={busy}>
              {t("circle.createGroup")}
            </Button>
          </form>

          {data.groupInvites?.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{row.groupName}</p>
                <p className="text-xs text-muted">{row.from.displayName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    void act({
                      action: "respond_group_invite",
                      inviteId: row.id,
                      accept: true,
                    })
                  }
                >
                  {t("circle.accept")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void act({
                      action: "respond_group_invite",
                      inviteId: row.id,
                      accept: false,
                    })
                  }
                >
                  {t("circle.decline")}
                </Button>
              </div>
            </div>
          ))}

          {!data.groups?.length ? (
            <p className="text-sm text-muted">{t("circle.emptyGroups")}</p>
          ) : (
            data.groups.map((g) => (
              <article key={g.id} className="space-y-3 rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{g.name}</h3>
                    <p className="text-xs text-muted">
                      {t("circle.members", { count: g.memberCount })} ·{" "}
                      {g.isOwner ? t("circle.owner") : t("circle.member")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setOpenGroupId(openGroupId === g.id ? null : g.id)
                      }
                    >
                      {t("circle.openGroup")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        void act({ action: "leave_group", groupId: g.id })
                      }
                    >
                      {t("circle.leaveGroup")}
                    </Button>
                  </div>
                </div>
                {openGroupId === g.id && groupDetail?.id === g.id ? (
                  <div className="space-y-3 border-t border-border pt-3">
                    <div className="flex flex-wrap gap-2">
                      {groupDetail.members.map((m) => (
                        <Badge key={m.user.id} tone="neutral">
                          {m.user.displayName}
                        </Badge>
                      ))}
                    </div>
                    <form
                      className="space-y-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const ok = await act({
                          action: "post_activity",
                          groupId: g.id,
                          kind: "CHECK_IN",
                          body: activityBody,
                        });
                        if (ok) setActivityBody("");
                      }}
                    >
                      <FormField id="activity-body" label={t("circle.activity")}>
                        <textarea
                          id="activity-body"
                          required
                          maxLength={500}
                          className="field-input min-h-20"
                          placeholder={t("circle.activityBody")}
                          value={activityBody}
                          onChange={(e) => setActivityBody(e.target.value)}
                        />
                      </FormField>
                      <Button type="submit" size="sm" disabled={busy}>
                        {t("circle.postActivity")}
                      </Button>
                    </form>
                    {groupDetail.activities.map((a) => (
                      <div key={a.id} className="rounded-lg border border-border p-3">
                        <p className="text-xs text-muted">
                          {a.author.displayName} ·{" "}
                          {a.kind === "PLAN"
                            ? t("circle.kind.plan")
                            : a.kind === "NOTE"
                              ? t("circle.kind.note")
                              : t("circle.kind.checkin")}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-secondary">
                          {a.body}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(["ENCOURAGE", "THANKS", "FOCUS"] as const).map((kind) => (
                            <Button
                              key={kind}
                              size="sm"
                              variant={
                                a.reactions.mine.includes(kind)
                                  ? "primary"
                                  : "ghost"
                              }
                              disabled={busy}
                              onClick={() =>
                                void act({
                                  action: "react",
                                  targetType: "ACTIVITY",
                                  targetId: a.id,
                                  kind,
                                })
                              }
                            >
                              {t(
                                kind === "ENCOURAGE"
                                  ? "circle.react.encourage"
                                  : kind === "THANKS"
                                    ? "circle.react.thanks"
                                    : "circle.react.focus"
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      ) : null}

      {tab === "privacy" ? (
        <div className="space-y-4 rounded-xl border border-border p-4">
          <FormField id="study-status" label={t("circle.studyStatus")} hint={t("circle.studyStatusHint")}>
            <select
              id="study-status"
              className="field-input"
              value={data.settings?.studyStatus ?? "HIDDEN"}
              disabled={busy}
              onChange={(e) =>
                void act({
                  action: "update_privacy",
                  studyStatus: e.target.value,
                }, t("circle.saved"))
              }
            >
              {(Object.keys(STATUS_KEYS) as CampusStudyStatusValue[]).map((status) => (
                <option key={status} value={status}>
                  {t(STATUS_KEYS[status])}
                </option>
              ))}
            </select>
          </FormField>
          <Toggle
            checked={Boolean(data.settings?.shareStudyStatus)}
            disabled={busy}
            label={t("circle.shareStatus")}
            onChange={(v) =>
              void act({ action: "update_privacy", shareStudyStatus: v }, t("circle.saved"))
            }
          />
          <Toggle
            checked={data.settings?.allowConnectionRequests !== false}
            disabled={busy}
            label={t("circle.allowRequests")}
            onChange={(v) =>
              void act(
                { action: "update_privacy", allowConnectionRequests: v },
                t("circle.saved")
              )
            }
          />
          <Toggle
            checked={data.settings?.allowStudyInvites !== false}
            disabled={busy}
            label={t("circle.allowStudyInvites")}
            onChange={(v) =>
              void act(
                { action: "update_privacy", allowStudyInvites: v },
                t("circle.saved")
              )
            }
          />
          <Toggle
            checked={data.settings?.allowQuizChallenges !== false}
            disabled={busy}
            label={t("circle.allowQuiz")}
            onChange={(v) =>
              void act(
                { action: "update_privacy", allowQuizChallenges: v },
                t("circle.saved")
              )
            }
          />
          <Toggle
            checked={data.settings?.allowGroupInvites !== false}
            disabled={busy}
            label={t("circle.allowGroups")}
            onChange={(v) =>
              void act(
                { action: "update_privacy", allowGroupInvites: v },
                t("circle.saved")
              )
            }
          />

          <FormField id="report-reason" label={t("circle.reportReason")}>
            <select
              id="report-reason"
              className="field-input"
              value={reportReason}
              onChange={(e) =>
                setReportReason(
                  e.target.value as (typeof CAMPUS_REPORT_REASONS)[number]
                )
              }
            >
              {REASON_KEYS.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {t(reason.key)}
                </option>
              ))}
            </select>
          </FormField>

          <section className="border-t border-border pt-4">
            <h2 className="text-sm font-semibold">{t("circle.blockedTitle")}</h2>
            {!data.blocked?.length ? (
              <p className="mt-2 text-sm text-muted">{t("circle.blockedEmpty")}</p>
            ) : (
              data.blocked.map((row) => (
                <div
                  key={row.id}
                  className="mt-2 flex flex-wrap items-center justify-between gap-2"
                >
                  <Person user={row.user} />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void act({ action: "unblock", userId: row.user.id })
                    }
                  >
                    {t("circle.unblock")}
                  </Button>
                </div>
              ))
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
