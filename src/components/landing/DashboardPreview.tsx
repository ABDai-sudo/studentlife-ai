import type { ReactNode } from "react";
import {
  ClipboardList,
  Flame,
  MessageCircle,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProductWindow } from "@/components/landing/ProductWindow";

/** Landing-page example only — not live user data. */
export function DashboardPreview() {
  return (
    <div className="relative">
      <p className="mb-2 text-center text-[0.7rem] font-medium text-muted">
        Example workspace preview · sample data
      </p>

      <ProductWindow title="StudentLife AI · Today">
        <div className="space-y-4 bg-background p-3 sm:p-4">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <MessageCircle className="h-3.5 w-3.5 text-primary" aria-hidden />
              AI Tutor
            </div>
            <p className="text-sm leading-relaxed text-secondary">
              Ready to study. Want a quick C algorithms recap before tomorrow’s
              test?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="7-day streak" value="7" tone="warning" icon={Flame} />
            <Metric label="XP" value="640" tone="primary" icon={TrendingUp} />
            <Metric label="Academic Aura" value="82" tone="primary" icon={Target} />
            <Metric label="Safe today" value="₹122" tone="success" icon={Wallet} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Upcoming assignment">
              <div className="flex items-start gap-2">
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    DBMS project report
                  </p>
                  <p className="mt-0.5 text-xs text-muted">Due Friday · 20 marks · 2 days left</p>
                </div>
              </div>
            </Panel>

            <Panel title="Level">
              <p className="text-sm font-semibold text-foreground">
                On schedule
              </p>
              <ProgressBar value={64} label="640 / 1000 XP to next level" className="mt-2" />
            </Panel>
          </div>

          <Panel title="Today’s three quests">
            <ul className="space-y-2">
              {[
                { done: true, text: "Study C Programming for 25 minutes" },
                { done: false, text: "Complete one pending assignment" },
                { done: false, text: "Finish a five-question quiz" },
              ].map((quest) => (
                <li
                  key={quest.text}
                  className="flex items-start gap-2 py-1.5 text-xs text-secondary"
                >
                  <span
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded border ${
                      quest.done
                        ? "border-success bg-success"
                        : "border-border bg-surface"
                    }`}
                    aria-hidden
                  />
                  <span
                    className={
                      quest.done
                        ? "text-muted line-through"
                        : "font-medium text-foreground"
                    }
                  >
                    {quest.text}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-[0.7rem] text-muted">
              Complete one meaningful activity to keep today’s streak.
            </p>
          </Panel>
        </div>
      </ProductWindow>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string;
  tone?: "default" | "primary" | "success" | "warning";
  icon?: typeof Flame;
}) {
  const valueClass =
    tone === "primary"
      ? "text-primary"
      : tone === "success"
        ? "text-success"
        : tone === "warning"
          ? "text-warning"
          : "text-foreground";
  return (
    <div>
      <p className="flex items-center gap-1 text-[0.65rem] font-medium text-muted">
        {Icon ? <Icon className="h-3 w-3" aria-hidden /> : null}
        {label}
      </p>
      <p className={`mt-1 text-sm font-semibold tracking-tight sm:text-base ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-border pt-3">
      <p className="mb-2.5 text-xs font-semibold text-foreground">{title}</p>
      {children}
    </div>
  );
}
