import { describe, it, expect } from "vitest";
import { computeBalances, minimizeCashFlow, settle } from "../lib/minimizeCashFlow";

describe("computeBalances", () => {
  it("nets credits and debits per participant", () => {
    const balances = computeBalances(["A", "B", "C"], [
      { fromId: "B", toId: "A", amount: 500 },
      { fromId: "C", toId: "A", amount: 250 },
      { fromId: "A", toId: "C", amount: 150 },
    ]);
    expect(balances.A).toBeCloseTo(500 + 250 - 150, 2);
    expect(balances.B).toBeCloseTo(-500, 2);
    expect(balances.C).toBeCloseTo(150 - 250, 2);
  });
});

describe("minimizeCashFlow", () => {
  it("settles a simple 3-person tangle in 2 transactions or fewer", () => {
    const balances = computeBalances(["A", "B", "C"], [
      { fromId: "B", toId: "A", amount: 500 },
      { fromId: "C", toId: "A", amount: 250 },
      { fromId: "A", toId: "C", amount: 150 },
    ]);
    const tx = minimizeCashFlow(balances);
    expect(tx.length).toBeLessThanOrEqual(2);

    // every transaction must sum back to a fully settled state
    const finalBalances = { ...balances };
    tx.forEach((t) => {
      finalBalances[t.from] += t.amount;
      finalBalances[t.to] -= t.amount;
    });
    Object.values(finalBalances).forEach((b) => expect(b).toBeCloseTo(0, 2));
  });

  it("produces zero transactions when debts exactly cancel out", () => {
    const balances = computeBalances(["A", "B"], [
      { fromId: "A", toId: "B", amount: 50 },
      { fromId: "B", toId: "A", amount: 50 },
    ]);
    const tx = minimizeCashFlow(balances);
    expect(tx.length).toBe(0);
  });

  it("handles a larger group without exceeding N-1 transactions", () => {
    const ids = ["A", "B", "C", "D", "E", "F"];
    const balances = computeBalances(ids, [
      { fromId: "A", toId: "B", amount: 100 },
      { fromId: "B", toId: "C", amount: 80 },
      { fromId: "C", toId: "D", amount: 60 },
      { fromId: "D", toId: "E", amount: 40 },
      { fromId: "E", toId: "F", amount: 20 },
      { fromId: "F", toId: "A", amount: 10 },
    ]);
    const tx = minimizeCashFlow(balances);
    // A well-known property: settlement never needs more than N-1 transactions.
    expect(tx.length).toBeLessThanOrEqual(ids.length - 1);
  });
});

describe("settle", () => {
  it("wraps computeBalances + minimizeCashFlow", () => {
    const tx = settle(["A", "B"], [{ fromId: "A", toId: "B", amount: 20 }]);
    expect(tx).toEqual([{ from: "A", to: "B", amount: 20 }]);
  });
});
