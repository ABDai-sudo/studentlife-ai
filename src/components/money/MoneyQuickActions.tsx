"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/components/i18n/LocaleProvider";

export function MoneyQuickActions({ coachCta }: { coachCta: string }) {
  const { t } = useT();
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Button href="/dashboard/expenses" size="sm">
        {t("money.logExpense")}
      </Button>
      <Button href="/dashboard/budget" variant="secondary" size="sm">
        {t("money.setBudgets")}
      </Button>
      <Button href="/dashboard/ai-coach" size="sm">
        {coachCta}
      </Button>
    </div>
  );
}
