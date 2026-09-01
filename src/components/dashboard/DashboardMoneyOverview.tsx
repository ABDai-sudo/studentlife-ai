"use client";

import { MessagesSquare, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { useT } from "@/components/i18n/LocaleProvider";
import { formatMoney } from "@/lib/money";

export type DashboardMoneySummaryView = {
  currency: string;
  moneyLeft: number | null;
  pocketMoney: number | null;
  daysLeft: number;
  safePerDay: number | null;
  monthSpent: number;
  todaySpent: number;
  categories: { category: string; percent: number; amount: number; label: string }[];
  recent: {
    id: string;
    description: string | null;
    categoryLabel: string;
    amount: number;
    currency: string;
  }[];
};

export function DashboardMoneyOverview({
  summary,
}: {
  summary: DashboardMoneySummaryView | null;
}) {
  const { t } = useT();

  if (!summary) {
    return (
      <div className="border-s-2 border-warning/50 px-4 py-3 text-base text-secondary">
        {t("money.loadErrorDashboard")}
      </div>
    );
  }

  const { currency } = summary;
  const hasSpend = summary.monthSpent > 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t("money.left")}
          value={
            summary.moneyLeft == null
              ? "—"
              : formatMoney(summary.moneyLeft, currency)
          }
          hint={
            summary.pocketMoney == null
              ? t("money.setPocketHint")
              : t("money.pocketMinusSpend")
          }
        />
        <StatCard
          label={t("money.daysLeft")}
          value={String(summary.daysLeft)}
          hint={t("money.thisMonth")}
        />
        <StatCard
          label={t("money.safePerDay")}
          value={
            summary.safePerDay == null
              ? "—"
              : formatMoney(summary.safePerDay, currency)
          }
          hint={t("money.leftDivDays")}
        />
        <StatCard
          label={t("money.monthSpending")}
          value={formatMoney(summary.monthSpent, currency)}
          hint={hasSpend ? t("money.fromLogged") : t("money.noExpensesYet")}
        />
        <StatCard
          label={t("money.spentToday")}
          value={formatMoney(summary.todaySpent, currency)}
          hint={t("money.loggedToday")}
        />
        <StatCard
          label={t("money.pocketMoney")}
          value={
            summary.pocketMoney == null
              ? t("money.notSet")
              : formatMoney(summary.pocketMoney, currency)
          }
          hint={t("money.fromProfile")}
        />
      </div>

      <div className="mt-8 grid gap-8 border-t border-border pt-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-foreground">
            {t("money.spendingByCategory")}
          </h3>
          {!hasSpend ? (
            <p className="text-base text-muted">
              {t("money.noSpendYet")}{" "}
              <a href="/dashboard/expenses" className="text-primary underline">
                {t("money.logFirstExpense")}
              </a>{" "}
              {t("money.toSeeCategories")}
            </p>
          ) : (
            <div className="space-y-2.5">
              {summary.categories.map((c) => (
                <ProgressBar
                  key={c.category}
                  value={c.percent}
                  label={`${c.label} · ${formatMoney(c.amount, currency)}`}
                />
              ))}
            </div>
          )}
        </section>

        <section className="border-t border-border pt-6 lg:border-t-0 lg:border-s lg:ps-8 lg:pt-0">
          <h3 className="mb-4 text-base font-semibold text-foreground">
            {t("money.recentExpenses")}
          </h3>
          {summary.recent.length === 0 ? (
            <p className="text-base text-muted">{t("money.nothingLogged")}</p>
          ) : (
            <ul className="divide-y divide-border text-base">
              {summary.recent.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="font-medium text-foreground">
                    {row.description || row.categoryLabel}
                  </span>
                  <span className="font-semibold text-foreground">
                    −{formatMoney(row.amount, row.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Button
            href="/dashboard/expenses"
            variant="secondary"
            size="sm"
            className="mt-4"
          >
            {t("money.openExpenses")}
          </Button>
        </section>
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <div className="mb-3 flex items-center gap-2 text-base font-semibold">
          <MessagesSquare className="h-4 w-4 text-primary" />
          {t("money.nextTip")}
        </div>
        <p className="text-base text-secondary">
          {hasSpend
            ? t("money.tipWithSpend", {
                amount: formatMoney(summary.monthSpent, currency),
              })
            : t("money.tipStart")}
        </p>
        <Button href="/dashboard/expenses" size="sm" className="mt-4">
          <Wallet className="me-1.5 h-4 w-4" />
          {t("actions.logSpending")}
        </Button>
      </div>
    </>
  );
}
