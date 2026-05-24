import { roundMoney } from "../../utils/money";

/**
 * Ledger rule: expenses are source of truth.
 * net = paidTotal - shareTotal
 *   positive → user is owed money (creditor)
 *   negative → user owes money (debtor)
 */
export const computeExpenseNet = (paidTotal: number, shareTotal: number): number =>
  roundMoney(paidTotal - shareTotal);

/**
 * Completed settlements adjust effective position (kept separate from expenses).
 * fromUser paid out → balance improves (+amount)
 * toUser received → balance decreases (-amount)
 */
export const computeSettlementAdjustment = (
  userId: string,
  settlements: { fromUserId: string; toUserId: string; amount: number }[],
): number => {
  let adjustment = 0;
  for (const s of settlements) {
    if (s.fromUserId === userId) adjustment += s.amount;
    if (s.toUserId === userId) adjustment -= s.amount;
  }
  return roundMoney(adjustment);
};

export const computeEffectiveNet = (
  expenseNet: number,
  settlementAdjustment: number,
): number => roundMoney(expenseNet + settlementAdjustment);

export interface IUserBalance {
  userId: string;
  paidTotal: number;
  shareTotal: number;
  expenseNet: number;
  settlementAdjustment: number;
  effectiveNet: number;
}

export const buildUserBalance = (
  userId: string,
  paidTotal: number,
  shareTotal: number,
  settlements: { fromUserId: string; toUserId: string; amount: number }[],
): IUserBalance => {
  const expenseNet = computeExpenseNet(paidTotal, shareTotal);
  const settlementAdjustment = computeSettlementAdjustment(userId, settlements);
  return {
    userId,
    paidTotal: roundMoney(paidTotal),
    shareTotal: roundMoney(shareTotal),
    expenseNet,
    settlementAdjustment,
    effectiveNet: computeEffectiveNet(expenseNet, settlementAdjustment),
  };
};

export interface IDebtTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

/**
 * Greedy creditor/debtor matching to minimize number of payments.
 * Input: effective net per user (after settlements).
 */
export const simplifyDebts = (
  balances: Pick<IUserBalance, "userId" | "effectiveNet">[],
): IDebtTransfer[] => {
  const creditors = balances
    .filter((b) => b.effectiveNet > 0.005)
    .map((b) => ({ userId: b.userId, amount: b.effectiveNet }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = balances
    .filter((b) => b.effectiveNet < -0.005)
    .map((b) => ({ userId: b.userId, amount: -b.effectiveNet }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: IDebtTransfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]!;
    const debtor = debtors[di]!;
    const pay = roundMoney(Math.min(creditor.amount, debtor.amount));
    if (pay > 0) {
      transfers.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: pay,
      });
    }
    creditor.amount = roundMoney(creditor.amount - pay);
    debtor.amount = roundMoney(debtor.amount - pay);
    if (creditor.amount < 0.005) ci++;
    if (debtor.amount < 0.005) di++;
  }

  return transfers;
};
