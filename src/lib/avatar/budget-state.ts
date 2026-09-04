/**
 * Coarse wallet band from existing finance totals.
 * Never expose exact balances — only rich | mid | cooked.
 */

export const BUDGET_STATES = ["rich", "mid", "cooked"] as const;

export type BudgetState = (typeof BUDGET_STATES)[number];

/** Ratios of moneyLeft / pocketMoney. Overridable in tests. */
export const BUDGET_THRESHOLDS = {
  cookedMaxRatio: 0.2,
  richMinRatio: 0.6,
} as const;

export type MoneyBandInput = {
  pocketMoney: number | null | undefined;
  moneyLeft: number | null | undefined;
  monthSpent?: number | null;
  cookedMaxRatio?: number;
  richMinRatio?: number;
};

export function resolveBudgetState(input: MoneyBandInput): BudgetState {
  const cookedMax = input.cookedMaxRatio ?? BUDGET_THRESHOLDS.cookedMaxRatio;
  const richMin = input.richMinRatio ?? BUDGET_THRESHOLDS.richMinRatio;
  const pocket = input.pocketMoney;
  const left = input.moneyLeft;

  if (pocket == null || !Number.isFinite(pocket) || pocket <= 0) {
    return "mid";
  }
  if (left == null || !Number.isFinite(left) || left < 0) {
    return "mid";
  }
  if (input.monthSpent != null && input.monthSpent > pocket) {
    return "cooked";
  }
  const ratio = left / pocket;
  if (ratio <= cookedMax) return "cooked";
  if (ratio >= richMin) return "rich";
  return "mid";
}
