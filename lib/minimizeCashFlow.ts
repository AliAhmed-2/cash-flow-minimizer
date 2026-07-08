/**
 * Cash Flow Minimization
 * -----------------------
 * Classic greedy settlement algorithm: repeatedly match the participant
 * with the largest credit against the participant with the largest debit,
 * settle the smaller of the two amounts between them, and repeat until
 * every balance nets to (approximately) zero.
 *
 * This is a pure function with no framework or database dependency,
 * which makes it independently unit-testable (see tests/minimizeCashFlow.test.ts).
 */

export type Balance = Record<string, number>;

export interface RawDebt {
  fromId: string;
  toId: string;
  amount: number;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

/** Epsilon used to treat near-zero balances as settled (avoids floating point noise). */
const EPS = 0.005;

/**
 * Reduces a list of participant IDs and raw debts down to net balances per participant.
 * Positive balance = participant is owed money (creditor).
 * Negative balance = participant owes money (debtor).
 */
export function computeBalances(
  participantIds: string[],
  debts: RawDebt[]
): Balance {
  const balances: Balance = {};
  participantIds.forEach((id) => {
    balances[id] = 0;
  });
  debts.forEach((d) => {
    balances[d.fromId] = (balances[d.fromId] ?? 0) - d.amount;
    balances[d.toId] = (balances[d.toId] ?? 0) + d.amount;
  });
  return balances;
}

/**
 * Given net balances, returns the minimum set of transactions required to
 * settle every balance to zero, using the greedy max-creditor / max-debtor
 * matching strategy.
 */
export function minimizeCashFlow(balances: Balance): Transaction[] {
  const bal: Balance = { ...balances };
  const ids = Object.keys(bal);
  const transactions: Transaction[] = [];

  // Safety cap so a pathological input can never cause infinite recursion.
  const maxSteps = ids.length * 2 + 10;

  function step(depth: number): void {
    if (depth > maxSteps) return;

    let maxCredit = EPS;
    let maxDebit = -EPS;
    let creditorId: string | null = null;
    let debtorId: string | null = null;

    for (const id of ids) {
      if (bal[id] > maxCredit) {
        maxCredit = bal[id];
        creditorId = id;
      }
      if (bal[id] < maxDebit) {
        maxDebit = bal[id];
        debtorId = id;
      }
    }

    // No creditor or no debtor left above the epsilon threshold: fully settled.
    if (!creditorId || !debtorId) return;

    const amount = Math.round(Math.min(maxCredit, -maxDebit) * 100) / 100;
    if (amount <= 0) return;

    transactions.push({ from: debtorId, to: creditorId, amount });

    bal[creditorId] -= amount;
    bal[debtorId] += amount;

    step(depth + 1);
  }

  step(0);
  return transactions;
}

/**
 * Convenience wrapper: takes participant IDs and raw debts directly,
 * returns the minimized transaction list. This is what the API route calls.
 */
export function settle(participantIds: string[], debts: RawDebt[]): Transaction[] {
  const balances = computeBalances(participantIds, debts);
  return minimizeCashFlow(balances);
}
