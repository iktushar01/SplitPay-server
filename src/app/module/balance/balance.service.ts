import { SettlementStatus } from "../../lib/prisma-exports";
import { prisma } from "../../lib/prisma";
import { toMoneyNumber } from "../../utils/money";
import {
  buildUserBalance,
  simplifyDebts,
  type IDebtTransfer,
  type IUserBalance,
} from "./balance.engine";

export interface IGroupLedgerSnapshot {
  balances: IUserBalance[];
  suggestedTransfers: IDebtTransfer[];
}

const loadGroupLedger = async (groupId: string): Promise<IGroupLedgerSnapshot> => {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  const memberIds = members.map((m) => m.userId);
  const paidByUser = new Map<string, number>();
  const shareByUser = new Map<string, number>();

  for (const id of memberIds) {
    paidByUser.set(id, 0);
    shareByUser.set(id, 0);
  }

  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: { splits: true },
  });

  for (const expense of expenses) {
    const amount = toMoneyNumber(expense.amount);
    paidByUser.set(
      expense.paidById,
      (paidByUser.get(expense.paidById) ?? 0) + amount,
    );

    for (const split of expense.splits) {
      const owed = toMoneyNumber(split.owedAmount);
      shareByUser.set(split.userId, (shareByUser.get(split.userId) ?? 0) + owed);
    }
  }

  const completedSettlements = await prisma.settlement.findMany({
    where: { groupId, status: SettlementStatus.COMPLETED },
    select: { fromUserId: true, toUserId: true, amount: true },
  });

  const settlementRows = completedSettlements.map((s) => ({
    fromUserId: s.fromUserId,
    toUserId: s.toUserId,
    amount: toMoneyNumber(s.amount),
  }));

  const balances = memberIds.map((userId) =>
    buildUserBalance(
      userId,
      paidByUser.get(userId) ?? 0,
      shareByUser.get(userId) ?? 0,
      settlementRows,
    ),
  );

  return {
    balances,
    suggestedTransfers: simplifyDebts(balances),
  };
};

export const BalanceService = {
  loadGroupLedger,
};
