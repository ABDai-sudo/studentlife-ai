"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { mountFetch } from "@/lib/react/mount-fetch";

type InboxItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationInbox() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InboxItem[]>([]);

  useEffect(() => {
    return mountFetch("/api/notifications", ({ ok, json }) => {
      if (!ok) return;
      const body = json as {
        success?: boolean;
        data?: { notifications?: InboxItem[] };
      } | null;
      if (!body?.success) return;
      setItems(body.data?.notifications ?? []);
    });
  }, []);

  const unread = useMemo(
    () => items.filter((item) => !item.readAt).length,
    [items]
  );

  async function markRead(id: string) {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", id }),
    });
    if (!res.ok) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, readAt: new Date().toISOString() } : item
      )
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-secondary transition-colors hover:bg-surface-secondary"
        aria-label={t("header.notifications")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label={t("actions.close")}
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            <p className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {t("header.notifications")}
            </p>
            {items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted">
                {t("header.notificationsEmpty")}
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {items.slice(0, 12).map((item) => (
                  <li key={item.id} className="border-b border-border last:border-b-0">
                    <Link
                      href={item.href || "/dashboard"}
                      className={`block px-3 py-2.5 text-sm hover:bg-surface-secondary ${
                        item.readAt ? "text-muted" : "text-foreground"
                      }`}
                      onClick={() => {
                        if (!item.readAt) void markRead(item.id);
                        setOpen(false);
                      }}
                    >
                      <span className="block font-medium">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {item.body}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
