import { StatusCodes } from "http-status-codes";
import { SettlementStatus } from "../../lib/prisma-exports";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { assertGroupMember } from "../splitpay/splitpay.helpers";
import type { ICreateSettlementPayload } from "./settlement.interface";

const listSettlements = async (groupId: string, requesterId: string) => {
  await assertGroupMember(groupId, requesterId);

  return prisma.settlement.findMany({
    where: { groupId },
    include: {
      fromUser: { select: { id: true, name: true, image: true } },
      toUser: { select: { id: true, name: true, image: true } },
    },
    orderBy: { date: "desc" },
  });
};

const createSettlement = async (
  groupId: string,
  requesterId: string,
  payload: ICreateSettlementPayload,
) => {
  await assertGroupMember(groupId, requesterId);

  if (payload.fromUserId === payload.toUserId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Payer and receiver must be different users",
    );
  }

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });
  const memberIds = new Set(members.map((m) => m.userId));

  if (
    !memberIds.has(payload.fromUserId) ||
    !memberIds.has(payload.toUserId)
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Both users must be members of this group",
    );
  }

  return prisma.settlement.create({
    data: {
      groupId,
      fromUserId: payload.fromUserId,
      toUserId: payload.toUserId,
      amount: payload.amount,
      status: SettlementStatus.PENDING,
      ...(payload.date ? { date: new Date(payload.date) } : {}),
    },
    include: {
      fromUser: { select: { id: true, name: true, image: true } },
      toUser: { select: { id: true, name: true, image: true } },
    },
  });
};

const completeSettlement = async (
  settlementId: string,
  requesterId: string,
) => {
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
  });

  if (!settlement) {
    throw new AppError(StatusCodes.NOT_FOUND, "Settlement not found");
  }

  await assertGroupMember(settlement.groupId, requesterId);

  if (settlement.status === SettlementStatus.COMPLETED) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Settlement is already completed");
  }

  return prisma.settlement.update({
    where: { id: settlementId },
    data: { status: SettlementStatus.COMPLETED },
    include: {
      fromUser: { select: { id: true, name: true, image: true } },
      toUser: { select: { id: true, name: true, image: true } },
    },
  });
};

export const SettlementService = {
  listSettlements,
  createSettlement,
  completeSettlement,
};
