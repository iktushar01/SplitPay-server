import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

export const assertGroupMember = async (groupId: string, userId: string) => {
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!membership) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not a member of this group",
    );
  }

  return membership;
};

export const assertGroupExists = async (groupId: string) => {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw new AppError(StatusCodes.NOT_FOUND, "Group not found");
  }
  return group;
};
