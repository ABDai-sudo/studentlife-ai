"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { appNav } from "@/components/app/nav";
import { useT } from "@/components/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/dictionaries/en";
import { useAppFlags } from "@/components/app/AppFlags";

type SidebarProps = {
  onNavigate?: () => void;
};

const SECTION_KEYS: {
  key: "main" | "money" | "account";
  titleKey: MessageKey;
}[] = [
  { key: "main", titleKey: "nav.section.study" },
  { key: "money", titleKey: "nav.section.money" },
  { key: "account", titleKey: "nav.section.account" },
];

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useT();
  const flags = useAppFlags();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center border-b border-border/80 px-4">
        <Logo />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="App">
        {SECTION_KEYS.map((section) => (
          <div key={section.key}>
            <p className="mb-1.5 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted">
              {t(section.titleKey)}
            </p>
            <div className="space-y-0.5">
              {appNav
                .filter((item) => item.section === section.key)
                .filter(
                  (item) =>
                    item.feature !== "campusCircle" || flags.campusCircle
                )
                .map((item) => {
                  const active =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  const label = t(item.i18nKey);
                  const hint = item.hintKey ? t(item.hintKey) : null;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-colors ${
                        active
                          ? "bg-primary-soft text-primary"
                          : "text-secondary hover:bg-surface-secondary hover:text-foreground"
                      }`}
                    >
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-snug">
                          {label}
                        </span>
                        {hint ? (
                          <span
                            className={`mt-0.5 block text-[0.72rem] leading-snug ${
                              active ? "text-primary/80" : "text-muted"
                            }`}
                          >
                            {hint}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
