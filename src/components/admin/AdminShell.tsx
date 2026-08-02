"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ChevronLeft } from "lucide-react";
import { adminNav } from "./nav";

type Props = {
  ownerEmail: string;
  ownerName: string | null;
  children: React.ReactNode;
};

export function AdminShell({ ownerEmail, ownerName, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebar = (
    <aside
      className={`flex h-full flex-col border-r border-border bg-sidebar text-sidebar-text transition-all ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
        {!collapsed && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Owner Admin
            </p>
            <p className="text-sm font-semibold text-white">StudentLife AI</p>
          </div>
        )}
        <button
          type="button"
          className="hidden rounded-lg p-2 text-slate-400 hover:bg-sidebar-active hover:text-white lg:inline-flex"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={`h-4 w-4 transition ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {adminNav.map((item) => {
          const active = isActive(
            item.href,
            "exact" in item ? item.exact : false
          );
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-sidebar-active font-medium text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
              title={item.label}
            >
              {collapsed ? item.label.slice(0, 1) : item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/dashboard"
          className="block rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
        >
          {collapsed ? "←" : "Back to Student App"}
        </Link>
        {!collapsed && (
          <p className="mt-2 truncate px-3 text-xs text-slate-500">
            {ownerName || ownerEmail}
          </p>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-50 h-full w-72 shadow-lg">{sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open admin menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Administration
              </p>
              <p className="text-xs text-muted">Private owner workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline">
              Owner
            </span>
            <span className="max-w-[140px] truncate text-xs text-muted sm:max-w-none">
              {ownerEmail}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
