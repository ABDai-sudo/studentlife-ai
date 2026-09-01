"use client";

import { StatCard } from "@/components/ui/StatCard";
import { useT } from "@/components/i18n/LocaleProvider";

export function MoneyStatLabels({
  moneyLeft,
  moneyLeftHint,
  daysLeft,
  safeDaily,
  healthScore,
  healthHint,
}: {
  moneyLeft: string;
  moneyLeftHint?: string;
  daysLeft: string;
  safeDaily: string;
  healthScore: string;
  healthHint?: string;
}) {
  const { t } = useT();
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t("money.remaining")}
        value={moneyLeft}
        hint={moneyLeftHint}
      />
      <StatCard label={t("money.daysLeft")} value={daysLeft} />
      <StatCard label={t("money.safeDailySpend")} value={safeDaily} />
      <StatCard
        label={t("money.healthScore")}
        value={healthScore}
        hint={healthHint}
      />
    </div>
  );
}
