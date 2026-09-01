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
