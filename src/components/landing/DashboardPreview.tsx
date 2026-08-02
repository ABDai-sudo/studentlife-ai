import type { ReactNode } from "react";
import {
  AlertTriangle,
  Brain,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProductWindow } from "@/components/landing/ProductWindow";

/** Landing-page example only — not live user data. */
export function DashboardPreview() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-primary/10 blur-3xl"
        aria-hidden
      />
      <p className="relative mb-2 text-center text-[0.7rem] font-medium text-muted">
        Example dashboard preview · sample data
      </p>

      <ProductWindow className="relative" title="Money Dashboard · Example">
        <div className="space-y-3 bg-background p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Monthly budget" value="₹5,000" />
            <Metric label="Money left" value="₹1,350" tone="primary" />
            <Metric label="Days left" value="11" />
            <Metric label="Safe today" value="₹122" tone="success" />
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              <Panel title="Financial health" badge="84 / 100">
                <ProgressBar value={84} label="Budget score" className="mb-2" />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Adherence" value="88%" />
                  <MiniStat label="Savings" value="16%" />
                  <MiniStat label="Goals" value="42%" />
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Overspending risk: Caution
                </div>
              </Panel>

              <Panel title="Spending this month">
                <div className="mb-3 flex h-16 items-end gap-1.5">
                  {[
                    { h: 78, c: "bg-primary" },
                    { h: 42, c: "bg-accent" },
                    { h: 55, c: "bg-ai" },
                    { h: 34, c: "bg-warning" },
                    { h: 28, c: "bg-success" },
                    { h: 18, c: "bg-border" },
                  ].map((bar, i) => (
                    <span
                      key={i}
                      className={`flex-1 rounded-t-sm ${bar.c}`}
                      style={{ height: `${bar.h}%` }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[0.7rem] text-secondary sm:grid-cols-3">
                  {[
                    ["Food", "₹1,420"],
                    ["Travel", "₹680"],
                    ["Education", "₹920"],
                    ["Entertainment", "₹540"],
                    ["Shopping", "₹310"],
                    ["Other", "₹180"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-md bg-surface-secondary px-2 py-1.5"
                    >
                      <span>{label}</span>
                      <span className="font-semibold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Recent transactions">
                {[
                  ["Canteen lunch", "Food", "−₹120"],
                  ["Bus pass", "Travel", "−₹200"],
                  ["Notebooks", "Education", "−₹85"],
                ].map(([name, cat, amount]) => (
                  <div
                    key={name}
                    className="mb-2 flex items-center justify-between last:mb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <p className="text-[0.7rem] text-muted">{cat}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {amount}
                    </span>
                  </div>
                ))}
              </Panel>
            </div>

            <div className="space-y-3">
              <Panel title="AI Money Coach" ai>
                <ul className="space-y-2 text-xs leading-relaxed text-secondary">
                  <li>• Food spending is 31% higher than last month.</li>
                  <li>• Limit cafeteria spending to ₹40/day to stay on budget.</li>
                  <li>• Save ₹50 daily to reach your laptop goal 18 days earlier.</li>
                  <li>• Your current safe daily spending limit is ₹122.</li>
                </ul>
              </Panel>

              <Panel title="Savings goals">
                <ProgressBar value={42} label="Laptop · ₹8k / ₹60k" className="mb-2.5" />
                <ProgressBar value={28} label="Course fees · ₹4k / ₹15k" className="mb-2.5" tone="accent" />
                <ProgressBar value={65} label="Emergency fund · ₹3.2k / ₹5k" tone="success" />
              </Panel>

              <Panel title="Also today" compact>
                <div className="space-y-2 text-xs text-secondary">
                  <Row icon={CalendarDays} text="Next class · Algorithms 10:00" />
                  <Row icon={ClipboardList} text="Assignment due · DBMS Fri" />
                  <Row icon={GraduationCap} text="Exam · Networks midterm 12 Aug" />
                </div>
              </Panel>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[0.7rem] text-muted">
            <Badge tone="neutral">Spent this month · ₹4,050</Badge>
            <Badge tone="success">Saved this month · ₹800</Badge>
            <Badge tone="primary">
              <Wallet className="h-3 w-3" />
              Pocket money mode
            </Badge>
          </div>
        </div>
      </ProductWindow>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "primary" | "success";
}) {
  const valueClass =
    tone === "primary"
      ? "text-primary"
      : tone === "success"
        ? "text-success"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface p-2.5">
      <p className="text-[0.65rem] font-medium text-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold tracking-tight sm:text-base ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function Panel({
  title,
  children,
  badge,
  ai = false,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  badge?: string;
  ai?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        ai ? "border-ai/20 bg-ai-soft/60" : "border-border bg-surface"
      } ${compact ? "p-2.5" : ""}`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          {ai ? <Brain className="h-3.5 w-3.5 text-ai" /> : null}
          {title}
        </div>
        {badge ? <Badge tone="primary">{badge}</Badge> : null}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background px-2 py-2">
      <p className="text-[0.65rem] text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Row({
  icon: Icon,
  text,
}: {
  icon: typeof CalendarDays;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span>{text}</span>
    </div>
  );
}
