"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { appNav } from "@/components/app/nav";

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center border-b border-border px-4">
        <Logo />
      </div>
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold text-foreground">Money workspace</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">
          Pocket money · expenses · goals
        </p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="App">
        {appNav.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

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
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.label}</span>
                {item.hint ? (
                  <span
                    className={`block text-[0.7rem] ${
                      active ? "text-primary/80" : "text-muted"
                    }`}
                  >
                    {item.hint}
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
