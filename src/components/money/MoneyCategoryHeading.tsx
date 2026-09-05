"use client";

import { useT } from "@/components/i18n/LocaleProvider";

export function MoneyCategoryHeading() {
  const { t } = useT();
  return (
    <h3 className="text-sm font-semibold">{t("money.categoryBudgets")}</h3>
  );
}

export function MoneySpentLabel({ amount }: { amount: string }) {
  const { t } = useT();
  return (
    <span className="min-w-0">
      {t("money.spentThisMonth")}: {amount}
    </span>
  );
}

export function MoneyLoadError() {
  const { t } = useT();
  return (
    <div className="border-s-2 border-warning/50 px-4 py-3 text-sm text-secondary">
      {t("money.loadError")}
    </div>
  );
}

export function MoneyBudgetStatus({ live }: { live: boolean }) {
  const { t } = useT();
  return <>{live ? t("money.live") : t("money.notSet")}</>;
}

export function MoneyNoBudgets() {
  const { t } = useT();
  return (
    <p className="text-sm text-secondary">
      {t("money.noBudgetsYet")}{" "}
      <a href="/dashboard/budget" className="text-primary underline">
        {t("money.addLimits")}
      </a>
    </p>
  );
}
