"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { appNav, type NavItem } from "@/components/app/nav";
import { PRIMARY_NAV_HREFS } from "@/components/app/nav-groups";
import { useT } from "@/components/i18n/LocaleProvider";
import { useAppFlags } from "@/components/app/AppFlags";
import { useHeaderIdentity } from "@/components/app/HeaderIdentity";

function isActivePath(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  items,
  pathname,
  t,
}: {
  items: NavItem[];
  pathname: string;
  t: ReturnType<typeof useT>["t"];
}) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 ${
              active
                ? "bg-sidebar-active text-white"
                : "text-sidebar-text hover:bg-sidebar-active/70 hover:text-white"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{t(item.i18nKey)}</span>
              {item.hintKey ? (
                <span className="block truncate text-[0.7rem] opacity-70">
                  {t(item.hintKey)}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function Fold({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const open = defaultOpen || expanded;

  return (
    <details
      className="rounded-lg border border-white/10"
      open={open}
      onToggle={(e) => {
        const next = (e.target as HTMLDetailsElement).open;
        if (defaultOpen) return;
        setExpanded(next);
      }}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-sm font-semibold text-sidebar-text marker:content-none">
        <span>{title}</span>
        <span className="text-xs opacity-70" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </summary>
      <div className="border-t border-white/10 p-1.5">{children}</div>
    </details>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useT();
  const flags = useAppFlags();
  const identity = useHeaderIdentity();
  const firstTime = identity != null && (identity.xpTotal ?? 0) === 0;

  const visible = appNav.filter(
    (item) => item.feature !== "campusCircle" || flags.campusCircle
  );
  const primary = visible.filter((item) => PRIMARY_NAV_HREFS.has(item.href));
  const moreStudy = visible.filter(
    (item) => item.section === "main" && !PRIMARY_NAV_HREFS.has(item.href)
  );
  const moreMoney = visible.filter(
    (item) => item.section === "money" && !PRIMARY_NAV_HREFS.has(item.href)
  );
  const account = visible.filter((item) => item.section === "account");

  const studyHasActive = moreStudy.some((item) => isActivePath(pathname, item.href));
  const moneyHasActive = moreMoney.some((item) => isActivePath(pathname, item.href));

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-text">
      <div className="px-4 pb-4 pt-6">
        <Logo light />
      </div>
      <nav
        className="flex-1 space-y-4 overflow-y-auto px-3 pb-6"
        aria-label={t("nav.section.study")}
      >
        {firstTime ? (
          <>
            <div>
              <p className="px-3 pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-sidebar-text/70">
                {t("dashboard.startHere")}
              </p>
              <NavLinks items={primary} pathname={pathname} t={t} />
            </div>
            <Fold title={t("nav.moreStudy")} defaultOpen={!firstTime || studyHasActive}>
              <NavLinks items={moreStudy} pathname={pathname} t={t} />
            </Fold>
            <Fold title={t("nav.moreMoney")} defaultOpen={!firstTime || moneyHasActive}>
              <NavLinks items={moreMoney} pathname={pathname} t={t} />
            </Fold>
            <div>
              <p className="px-3 pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-sidebar-text/70">
                {t("nav.section.account")}
              </p>
              <NavLinks items={account} pathname={pathname} t={t} />
            </div>
          </>
        ) : (
          (
            [
              { id: "main" as const, label: t("nav.section.study") },
              { id: "money" as const, label: t("nav.section.money") },
              { id: "account" as const, label: t("nav.section.account") },
            ] as const
          ).map((section) => (
            <div key={section.id}>
              <p className="px-3 pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-sidebar-text/70">
                {section.label}
              </p>
              <NavLinks
                items={visible.filter((item) => item.section === section.id)}
                pathname={pathname}
                t={t}
              />
            </div>
          ))
        )}
      </nav>
    </aside>
  );
}
