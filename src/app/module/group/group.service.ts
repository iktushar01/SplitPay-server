import { StatusCodes } from "http-status-codes";
import { GroupMemberRole } from "../../lib/prisma-exports";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { BalanceService } from "../balance/balance.service";
import {
  assertGroupExists,
  assertGroupMember,
} from "../splitpay/splitpay.helpers";
import type { IAddGroupMemberPayload, ICreateGroupPayload } from "./group.interface";

const createGroup = async (creatorId: string, payload: ICreateGroupPayload) => {
  return prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        name: payload.name,
        ...(payload.description !== undefined
          ? { description: payload.description }
          : {}),
      },
    });

    await tx.groupMember.create({
      data: {
        groupId: group.id,
        userId: creatorId,
        role: GroupMemberRole.ADMIN,
      },
    });

    return group;
  });
};

const getMyGroups = async (userId: string) => {
  return prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      _count: { select: { expenses: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
};

const getGroupById = async (groupId: string, requesterId: string) => {
  await assertGroupMember(groupId, requesterId);

  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
};

const addMember = async (
  groupId: string,
  requesterId: string,
  payload: IAddGroupMemberPayload,
) => {
  const requesterMembership = await assertGroupMember(groupId, requesterId);

  if (requesterMembership.role !== GroupMemberRole.ADMIN) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Only group admins can add members",
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, isDeleted: true, status: true },
  });

  if (!user || user.isDeleted) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const existing = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: { userId: payload.userId, groupId },
    },
  });

  if (existing) {
    throw new AppError(StatusCodes.CONFLICT, "User is already in this group");
  }

  return prisma.groupMember.create({
    data: {
      groupId,
      userId: payload.userId,
      role: GroupMemberRole.MEMBER,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });
};

const getDashboard = async (groupId: string, requesterId: string) => {
  await assertGroupMember(groupId, requesterId);
  await assertGroupExists(groupId);

  const [group, expenses, ledger] = await Promise.all([
    prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
    }),
    prisma.expense.findMany({
      where: { groupId },
      include: {
        paidBy: { select: { id: true, name: true, image: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    }),
    BalanceService.loadGroupLedger(groupId),
  ]);

  const membersById = new Map(
    group!.members.map((m) => [m.userId, m.user]),
  );

  const balancesWithUsers = ledger.balances.map((b) => ({
    ...b,
    user: membersById.get(b.userId) ?? null,
  }));

  const suggestedTransfers = ledger.suggestedTransfers.map((t) => ({
    ...t,
    fromUser: membersById.get(t.fromUserId) ?? null,
    toUser: membersById.get(t.toUserId) ?? null,
  }));

  return {
    group,
    expenses,
    balances: balancesWithUsers,
    suggestedTransfers,
  };
};

export const GroupService = {
  createGroup,
  getMyGroups,
  getGroupById,
  addMember,
  getDashboard,
};
