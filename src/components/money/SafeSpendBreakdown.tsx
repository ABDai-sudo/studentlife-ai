"use client";

import { formatMoney } from "@/lib/money";
import { useT } from "@/components/i18n/LocaleProvider";
import { Button } from "@/components/ui/Button";

export function SafeSpendBreakdown({
  currency,
  pocketMoney,
  necessaryCommitted,
  discretionaryBudget,
  monthSpent,
  moneyLeft,
  daysLeft,
  safePerDay,
}: {
  currency: string;
  pocketMoney: number | null;
  necessaryCommitted: number;
  discretionaryBudget: number | null;
  monthSpent: number;
  moneyLeft: number | null;
  daysLeft: number;
  safePerDay: number | null;
}) {
  const { t } = useT();
  const money = (n: number | null) =>
    n == null ? "—" : formatMoney(n, currency);

  return (
    <section
      className="mt-4 rounded-2xl border border-border bg-surface p-4 text-sm"
      aria-label={t("money.safeBreakdown")}
    >
      <p className="font-semibold text-foreground">{t("money.safeBreakdown")}</p>
      <ol className="mt-3 space-y-1.5 text-secondary">
        <li className="flex justify-between gap-3">
          <span>{t("money.formulaPocket")}</span>
          <span className="font-medium text-foreground">{money(pocketMoney)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span>− {t("money.formulaNecessary")}</span>
          <span className="font-medium text-foreground">
            {necessaryCommitted > 0
              ? money(necessaryCommitted)
              : t("money.necessaryUnset")}
          </span>
        </li>
        <li className="flex justify-between gap-3 border-t border-border pt-1.5">
          <span>= {t("money.formulaDiscretionary")}</span>
          <span className="font-medium text-foreground">
            {money(discretionaryBudget)}
          </span>
        </li>
        <li className="flex justify-between gap-3">
          <span>− {t("money.formulaLogged")}</span>
          <span className="font-medium text-foreground">{money(monthSpent)}</span>
        </li>
        <li className="flex justify-between gap-3 border-t border-border pt-1.5">
          <span>= {t("money.formulaLeft")}</span>
          <span className="font-medium text-foreground">{money(moneyLeft)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span>÷ {t("money.formulaDays")}</span>
          <span className="font-medium text-foreground">{daysLeft}</span>
        </li>
        <li className="flex justify-between gap-3 border-t border-border pt-1.5 text-foreground">
          <span className="font-semibold">= {t("money.formulaSafe")}</span>
          <span className="font-semibold">{money(safePerDay)}</span>
        </li>
      </ol>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        {t("money.doubleCountHint")}
      </p>
      {necessaryCommitted <= 0 ? (
        <Button
          href="/dashboard/profile"
          size="sm"
          variant="secondary"
          className="mt-3 min-h-11"
        >
          {t("money.necessary")}
        </Button>
      ) : null}
    </section>
  );
}
