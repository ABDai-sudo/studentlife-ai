"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { appNav } from "@/components/app/nav";
import { useT } from "@/components/i18n/LocaleProvider";
import { useAppFlags } from "@/components/app/AppFlags";
import { useState } from "react";

const PRIMARY_HREFS = new Set([
  "/dashboard",
  "/dashboard/ai-tutor",
  "/dashboard/study-buddy",
  "/dashboard/assignments",
  "/dashboard/exam-prep",
  "/dashboard/money",
  "/dashboard/profile",
]);

type MobileNavProps = {
  onNavigate?: () => void;
  firstTime?: boolean;
};

export function MobileNav({ onNavigate, firstTime = false }: MobileNavProps) {
  const pathname = usePathname();
  const { t } = useT();
  const flags = useAppFlags();
  const [studyOpen, setStudyOpen] = useState(!firstTime);
  const [moneyOpen, setMoneyOpen] = useState(false);

  const visible = appNav.filter(
    (item) => item.feature !== "campusCircle" || flags.campusCircle
  );
  const primary = visible.filter((item) => PRIMARY_HREFS.has(item.href));
  const moreStudy = visible.filter(
    (item) => item.section === "main" && !PRIMARY_HREFS.has(item.href)
  );
  const moreMoney = visible.filter(
    (item) => item.section === "money" && !PRIMARY_HREFS.has(item.href)
  );
  const account = visible.filter((item) => item.section === "account");

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="flex h-full w-[min(20rem,100vw)] max-w-full flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center justify-between gap-2 border-b border-border/80 px-4">
        <Logo />
      </div>
      <nav
        className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3"
        aria-label={t("nav.section.study")}
      >
        <p className="px-3 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted">
          {t("nav.primary")}
        </p>
        <div className="space-y-1">
          {primary.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 ${
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-secondary hover:bg-surface-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="truncate text-sm font-semibold">{t(item.i18nKey)}</span>
              </Link>
            );
          })}
        </div>

        <details
          className="rounded-lg border border-border"
          open={studyOpen}
          onToggle={(e) => setStudyOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center px-3 text-sm font-semibold marker:content-none">
            {t("nav.moreStudy")}
          </summary>
          <div className="space-y-1 border-t border-border p-2">
            {moreStudy.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 ${
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="truncate text-sm">{t(item.i18nKey)}</span>
                </Link>
              );
            })}
          </div>
        </details>

        <details
          className="rounded-lg border border-border"
          open={moneyOpen}
          onToggle={(e) => setMoneyOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center px-3 text-sm font-semibold marker:content-none">
            {t("nav.moreMoney")}
          </summary>
          <div className="space-y-1 border-t border-border p-2">
            {moreMoney.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 ${
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-secondary hover:bg-surface-secondary"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="truncate text-sm">{t(item.i18nKey)}</span>
                </Link>
              );
            })}
          </div>
        </details>

        <div className="space-y-1">
          {account.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 ${
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-secondary hover:bg-surface-secondary"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="truncate text-sm font-semibold">{t(item.i18nKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
