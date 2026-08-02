import type { ReactNode } from "react";
import { BookOpenCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 bg-background">
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden border-r border-border bg-surface p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_0%,rgba(37,99,235,0.12),transparent_55%)]"
          aria-hidden
        />
        <Logo />
        <div className="relative">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <BookOpenCheck className="h-5 w-5" aria-hidden />
          </div>
          <h2 className="max-w-sm text-2xl font-semibold tracking-tight text-foreground">
            Make your money last through the month.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-secondary">
            Track spending, set a safe daily budget, save for goals, and keep
            classes organized in the same app.
          </p>
          <div className="mt-8 space-y-2">
            {["Money left & safe daily spend", "AI Money Coach tips", "Goals + classes"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </div>
        <p className="relative text-xs text-muted">
          Free for students · Secure accounts
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-secondary">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
