export type SafeSpendInput = {
  pocketMoney: number | null;
  necessaryCommitted: number;
  monthSpent: number;
  daysLeft: number;
};

export type SafeSpendBreakdown = {
  pocketMoney: number | null;
  necessaryCommitted: number;
  discretionaryBudget: number | null;
  monthSpent: number;
  moneyLeft: number | null;
  daysLeft: number;
  safePerDay: number | null;
};

/**
 * Pocket money
 * − necessary/committed expenses (reserved, not logged spend)
 * − logged spending this period
 * = money left
 * ÷ days left
 * = Safe Spend today
 *
 * Necessary expenses are a reservation. Logged expenses are additional.
 * Do not enter the same bill in both places (double-counting).
 */
export function computeSafeSpend(input: SafeSpendInput): SafeSpendBreakdown {
  const daysLeft = Math.max(1, Math.floor(input.daysLeft) || 1);
  const necessaryCommitted = Math.max(0, input.necessaryCommitted || 0);
  const monthSpent = Math.max(0, input.monthSpent || 0);
  const pocket = input.pocketMoney;

  if (pocket == null) {
    return {
      pocketMoney: null,
      necessaryCommitted,
      discretionaryBudget: null,
      monthSpent,
      moneyLeft: null,
      daysLeft,
      safePerDay: null,
    };
  }

  const discretionaryBudget = Math.max(0, pocket - necessaryCommitted);
  const moneyLeft = Math.max(0, discretionaryBudget - monthSpent);
  const safePerDay = Math.floor((moneyLeft / daysLeft) * 100) / 100;

  return {
    pocketMoney: pocket,
    necessaryCommitted,
    discretionaryBudget,
    monthSpent,
    moneyLeft,
    daysLeft,
    safePerDay,
  };
}
