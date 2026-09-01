import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";
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
    <div className="auth-shell flex min-h-full flex-1 bg-background">
      <div className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden border-r border-border bg-surface p-10 xl:p-12 lg:flex">
        <Logo />
        <div className="relative max-w-md">
          <h2 className="auth-panel-title text-[1.65rem] font-semibold leading-snug text-foreground">
            Study, deadlines, and budget — in one place.
          </h2>
          <p className="auth-panel-copy mt-3.5 max-w-sm text-base leading-[1.65] text-secondary">
            Study with AI, manage deadlines and streaks, and keep your student
            budget under control — securely in one place.
          </p>
          <ul className="mt-8 space-y-2.5">
            {[
              "AI Tutor and assignment help",
              "Streaks, quests, and exam prep",
              "Private student budget tools",
            ].map((item) => (
              <li
                key={item}
                className="border-t border-border pt-3 text-[0.9375rem] font-medium leading-snug tracking-normal text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[0.8125rem] leading-relaxed tracking-normal text-muted">
          Free student plan · Secure accounts · No credit card required
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 sm:py-10">
        <div className="auth-card mx-auto w-full max-w-[26rem] rounded-2xl border border-border bg-surface p-6 shadow-md sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center sm:items-start sm:text-left">
            <div className="mb-5 lg:hidden">
              <Logo />
            </div>
            <div
              className="auth-mark mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/15 bg-primary-soft"
              aria-hidden
            >
              <GraduationCap
                className="h-[1.15rem] w-[1.15rem] text-primary"
              />
            </div>
            <h1 className="auth-title text-[1.5rem] font-semibold leading-snug text-foreground sm:text-[1.625rem]">
              {title}
            </h1>
            <p className="auth-subtitle mt-2.5 max-w-sm text-base leading-[1.65] text-secondary">
              {subtitle}
            </p>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
