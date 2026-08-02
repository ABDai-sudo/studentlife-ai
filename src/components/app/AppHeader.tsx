"use client";

import Link from "next/link";
import { Bell, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Sidebar } from "@/components/app/Sidebar";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  userName?: string;
};

export function AppHeader({
  title,
  subtitle,
  userName = "Student",
}: AppHeaderProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface px-4 lg:px-6">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border lg:hidden"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <div className="lg:hidden">
          <Logo compact />
        </div>

        <div className="hidden min-w-0 sm:block">
          <h1 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-xs text-muted">{subtitle}</p>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="relative hidden md:block">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="h-9 w-56 rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="Search workspace"
            />
          </label>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-secondary hover:bg-surface-secondary"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-2 py-1 hover:bg-surface-secondary"
          >
            <Avatar name={userName} />
            <span className="hidden text-sm font-medium text-foreground lg:inline">
              {userName}
            </span>
          </Link>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/30"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-xl">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
