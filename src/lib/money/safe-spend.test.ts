import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeSafeSpend } from "./safe-spend";

describe("computeSafeSpend", () => {
  it("keeps the original pocket÷days math when necessities are 0", () => {
    const result = computeSafeSpend({
      pocketMoney: 5000,
      necessaryCommitted: 0,
      monthSpent: 0,
      daysLeft: 13,
    });
    assert.equal(result.safePerDay, 384.61);
    assert.equal(result.moneyLeft, 5000);
  });

  it("reserves necessary expenses before dividing remaining days", () => {
    const result = computeSafeSpend({
      pocketMoney: 5000,
      necessaryCommitted: 2000,
      monthSpent: 0,
      daysLeft: 13,
    });
    assert.equal(result.discretionaryBudget, 3000);
    assert.equal(result.moneyLeft, 3000);
    assert.equal(result.safePerDay, 230.76);
  });

  it("does not subtract committed expenses twice from logged spend", () => {
    const result = computeSafeSpend({
      pocketMoney: 5000,
      necessaryCommitted: 2000,
      monthSpent: 500,
      daysLeft: 13,
    });
    assert.equal(result.moneyLeft, 2500);
    assert.equal(result.safePerDay, 192.3);
  });
});
