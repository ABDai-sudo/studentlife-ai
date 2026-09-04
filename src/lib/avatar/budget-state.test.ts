import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveBudgetState } from "./budget-state";

describe("budget band", () => {
  it("uses mid when pocket money is missing", () => {
    assert.equal(
      resolveBudgetState({ pocketMoney: null, moneyLeft: 500 }),
      "mid"
    );
  });

  it("marks cooked when little is left", () => {
    assert.equal(
      resolveBudgetState({ pocketMoney: 10000, moneyLeft: 1000 }),
      "cooked"
    );
    assert.equal(
      resolveBudgetState({
        pocketMoney: 8000,
        moneyLeft: 0,
        monthSpent: 9000,
      }),
      "cooked"
    );
  });

  it("marks rich when most of the month remains", () => {
    assert.equal(
      resolveBudgetState({ pocketMoney: 10000, moneyLeft: 7500 }),
      "rich"
    );
  });

  it("marks mid in the stable middle", () => {
    assert.equal(
      resolveBudgetState({ pocketMoney: 10000, moneyLeft: 4500 }),
      "mid"
    );
  });

  it("honors custom thresholds", () => {
    assert.equal(
      resolveBudgetState({
        pocketMoney: 10000,
        moneyLeft: 3000,
        cookedMaxRatio: 0.4,
      }),
      "cooked"
    );
  });
});
