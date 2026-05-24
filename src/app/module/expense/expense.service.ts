import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { roundMoney, splitEqually } from "../../utils/money";
import { assertGroupMember } from "../splitpay/splitpay.helpers";
import type { ICreateExpensePayload } from "./expense.interface";

const listExpenses = async (
  groupId: string,
  requesterId: string,
  filters?: { userId?: string; from?: Date; to?: Date },
) => {
  await assertGroupMember(groupId, requesterId);

  return prisma.expense.findMany({
    where: {
      groupId,
      ...(filters?.userId
        ? {
            OR: [
              { paidById: filters.userId },
              { splits: { some: { userId: filters.userId } } },
            ],
          }
        : {}),
      ...(filters?.from || filters?.to
        ? {
            date: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    },
    include: {
      paidBy: { select: { id: true, name: true, image: true } },
      splits: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });
};

const createExpense = async (
  groupId: string,
  requesterId: string,
  payload: ICreateExpensePayload,
) => {
  await assertGroupMember(groupId, requesterId);

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  const memberIds = members.map((m) => m.userId);

  if (!memberIds.includes(payload.paidById)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Payer must be a member of this group",
    );
  }

  const participantIds = payload.participantIds ?? memberIds;

  for (const id of participantIds) {
    if (!memberIds.includes(id)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "All participants must be group members",
      );
    }
  }

  const splits = splitEqually(roundMoney(payload.amount), participantIds);

  const splitSum = splits.reduce((sum, s) => sum + s.owedAmount, 0);
  if (Math.abs(splitSum - roundMoney(payload.amount)) > 0.01) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Split total mismatch");
  }

  return prisma.expense.create({
    data: {
      groupId,
      title: payload.title,
      amount: payload.amount,
      paidById: payload.paidById,
      ...(payload.date ? { date: new Date(payload.date) } : {}),
      splits: {
        create: splits.map((s) => ({
          userId: s.userId,
          owedAmount: s.owedAmount,
        })),
      },
    },
    include: {
      paidBy: { select: { id: true, name: true, image: true } },
      splits: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });
};

export const ExpenseService = {
  listExpenses,
  createExpense,
};
