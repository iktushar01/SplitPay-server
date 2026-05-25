import { StatusCodes } from "http-status-codes";
import { GroupInviteStatus } from "../../lib/prisma-exports";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { envVars } from "../../../config/env";
import { sendEmail } from "../../utils/email";
import { assertGroupMember } from "../splitpay/splitpay.helpers";

const INVITE_EXPIRY_DAYS = 7;

const sendInviteEmail = async (params: {
  to: string;
  groupName: string;
  inviterName: string;
  recipientName: string;
  isNewUser: boolean;
  inviteId: string;
}) => {
  const { to, groupName, inviterName, recipientName, isNewUser, inviteId } =
    params;
  const frontendUrl = envVars.FRONTEND_URL.replace(/\/$/, "");

  await sendEmail({
    to,
    subject: isNewUser
      ? `Join SplitPay — invited to "${groupName}"`
      : `You're invited to "${groupName}" on SplitPay`,
    templateName: "groupInvite",
    templateData: {
      name: recipientName,
      groupName,
      inviterName,
      isNewUser,
      registerUrl: isNewUser
        ? `${frontendUrl}/register?email=${encodeURIComponent(to)}&invite=${inviteId}`
        : null,
      dashboardUrl: `${frontendUrl}/dashboard`,
    },
  });
};

const inviteByEmail = async (
  groupId: string,
  inviterId: string,
  email: string,
) => {
  await assertGroupMember(groupId, inviterId);

  const normalizedEmail = email.toLowerCase().trim();

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true },
  });

  if (!group) {
    throw new AppError(StatusCodes.NOT_FOUND, "Group not found");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      isDeleted: true,
      groupMemberships: {
        where: { groupId },
        select: { id: true },
      },
    },
  });

  if (existingUser?.groupMemberships.length) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "This user is already in the group",
    );
  }

  const existingInvite = await prisma.groupInvite.findUnique({
    where: {
      groupId_email: { groupId, email: normalizedEmail },
    },
  });

  if (existingInvite?.status === GroupInviteStatus.PENDING) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "An invitation has already been sent to this email",
    );
  }

  const inviter = await prisma.user.findUnique({
    where: { id: inviterId },
    select: { name: true },
  });

  const expiresAt = new Date(
    Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  const invite = await prisma.groupInvite.upsert({
    where: {
      groupId_email: { groupId, email: normalizedEmail },
    },
    create: {
      groupId,
      email: normalizedEmail,
      invitedById: inviterId,
      inviteeUserId: existingUser?.id ?? null,
      status: GroupInviteStatus.PENDING,
      expiresAt,
    },
    update: {
      invitedById: inviterId,
      inviteeUserId: existingUser?.id ?? null,
      status: GroupInviteStatus.PENDING,
      expiresAt,
      updatedAt: new Date(),
    },
    include: {
      group: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, name: true, email: true } },
    },
  });

  const isNewUser = !existingUser;

  try {
    await sendInviteEmail({
      to: normalizedEmail,
      groupName: group.name,
      inviterName: inviter?.name ?? "Someone",
      recipientName:
        existingUser?.name ?? normalizedEmail.split("@")[0] ?? normalizedEmail,
      isNewUser,
      inviteId: invite.id,
    });
  } catch (err) {
    console.error("Invite email failed (invite still created):", err);
  }

  return {
    invite,
    isNewUser,
    message: isNewUser
      ? "Invitation email sent. They can sign up on SplitPay to join this group."
      : "Invitation sent. They can accept it from their dashboard.",
  };
};

const getMyPendingInvites = async (userId: string, userEmail: string) => {
  const normalizedEmail = userEmail.toLowerCase().trim();
  const now = new Date();

  await prisma.groupInvite.updateMany({
    where: {
      status: GroupInviteStatus.PENDING,
      expiresAt: { lt: now },
    },
    data: { status: GroupInviteStatus.EXPIRED },
  });

  return prisma.groupInvite.findMany({
    where: {
      status: GroupInviteStatus.PENDING,
      AND: [
        {
          OR: [{ inviteeUserId: userId }, { email: normalizedEmail }],
        },
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      ],
    },
    include: {
      group: { select: { id: true, name: true, description: true } },
      invitedBy: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const acceptInvite = async (inviteId: string, userId: string, userEmail: string) => {
  const invite = await prisma.groupInvite.findUnique({
    where: { id: inviteId },
    include: { group: true },
  });

  if (!invite || invite.status !== GroupInviteStatus.PENDING) {
    throw new AppError(StatusCodes.NOT_FOUND, "Invitation not found or expired");
  }

  const normalizedEmail = userEmail.toLowerCase().trim();
  const canAccept =
    invite.inviteeUserId === userId ||
    invite.email.toLowerCase() === normalizedEmail;

  if (!canAccept) {
    throw new AppError(StatusCodes.FORBIDDEN, "This invitation is not for you");
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    await prisma.groupInvite.update({
      where: { id: inviteId },
      data: { status: GroupInviteStatus.EXPIRED },
    });
    throw new AppError(StatusCodes.BAD_REQUEST, "This invitation has expired");
  }

  const existing = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: { userId, groupId: invite.groupId },
    },
  });

  if (existing) {
    await prisma.groupInvite.update({
      where: { id: inviteId },
      data: { status: GroupInviteStatus.ACCEPTED, inviteeUserId: userId },
    });
    return invite.group;
  }

  await prisma.$transaction([
    prisma.groupMember.create({
      data: { groupId: invite.groupId, userId },
    }),
    prisma.groupInvite.update({
      where: { id: inviteId },
      data: {
        status: GroupInviteStatus.ACCEPTED,
        inviteeUserId: userId,
      },
    }),
  ]);

  return invite.group;
};

const declineInvite = async (
  inviteId: string,
  userId: string,
  userEmail: string,
) => {
  const invite = await prisma.groupInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite || invite.status !== GroupInviteStatus.PENDING) {
    throw new AppError(StatusCodes.NOT_FOUND, "Invitation not found");
  }

  const normalizedEmail = userEmail.toLowerCase().trim();
  const canDecline =
    invite.inviteeUserId === userId ||
    invite.email.toLowerCase() === normalizedEmail;

  if (!canDecline) {
    throw new AppError(StatusCodes.FORBIDDEN, "This invitation is not for you");
  }

  await prisma.groupInvite.update({
    where: { id: inviteId },
    data: { status: GroupInviteStatus.DECLINED, inviteeUserId: userId },
  });
};

/** Link pending email invites after registration */
const linkInvitesForUser = async (userId: string, email: string) => {
  await prisma.groupInvite.updateMany({
    where: {
      email: email.toLowerCase().trim(),
      inviteeUserId: null,
      status: GroupInviteStatus.PENDING,
    },
    data: { inviteeUserId: userId },
  });
};

export const InviteService = {
  inviteByEmail,
  getMyPendingInvites,
  acceptInvite,
  declineInvite,
  linkInvitesForUser,
};
