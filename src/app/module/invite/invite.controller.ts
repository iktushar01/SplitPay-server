import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { InviteService } from "./invite.service";

const inviteToGroup = catchAsync(async (req: Request, res: Response) => {
  const result = await InviteService.inviteByEmail(
    String(req.params.groupId),
    req.user!.userId,
    req.body.email,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: result.message,
    data: {
      invite: result.invite,
      isNewUser: result.isNewUser,
    },
  });
});

const getMyInvites = catchAsync(async (req: Request, res: Response) => {
  const email = (req.user as { email?: string }).email;
  if (!email) {
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      data: [],
    });
  }

  const result = await InviteService.getMyPendingInvites(
    req.user!.userId,
    email,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    data: result,
  });
});

const acceptInvite = catchAsync(async (req: Request, res: Response) => {
  const email = (req.user as { email?: string }).email ?? "";
  const group = await InviteService.acceptInvite(
    String(req.params.inviteId),
    req.user!.userId,
    email,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "You joined the group",
    data: group,
  });
});

const declineInvite = catchAsync(async (req: Request, res: Response) => {
  const email = (req.user as { email?: string }).email ?? "";
  await InviteService.declineInvite(
    String(req.params.inviteId),
    req.user!.userId,
    email,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Invitation declined",
    data: null,
  });
});

export const InviteController = {
  inviteToGroup,
  getMyInvites,
  acceptInvite,
  declineInvite,
};
