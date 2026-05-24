import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { GroupService } from "./group.service";

const createGroup = catchAsync(async (req: Request, res: Response) => {
  const result = await GroupService.createGroup(req.user!.userId, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Group created",
    data: result,
  });
});

const getMyGroups = catchAsync(async (req: Request, res: Response) => {
  const result = await GroupService.getMyGroups(req.user!.userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    data: result,
  });
});

const getGroupById = catchAsync(async (req: Request, res: Response) => {
  const result = await GroupService.getGroupById(
    String(req.params.groupId),
    req.user!.userId,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    data: result,
  });
});

const addMember = catchAsync(async (req: Request, res: Response) => {
  const result = await GroupService.addMember(
    String(req.params.groupId),
    req.user!.userId,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Member added",
    data: result,
  });
});

const getDashboard = catchAsync(async (req: Request, res: Response) => {
  const result = await GroupService.getDashboard(
    String(req.params.groupId),
    req.user!.userId,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    data: result,
  });
});

export const GroupController = {
  createGroup,
  getMyGroups,
  getGroupById,
  addMember,
  getDashboard,
};
