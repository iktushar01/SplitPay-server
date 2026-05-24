import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { SettlementService } from "./settlement.service";

const listSettlements = catchAsync(async (req: Request, res: Response) => {
  const result = await SettlementService.listSettlements(
    String(req.params.groupId),
    req.user!.userId,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    data: result,
  });
});

const createSettlement = catchAsync(async (req: Request, res: Response) => {
  const result = await SettlementService.createSettlement(
    String(req.params.groupId),
    req.user!.userId,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Settlement recorded",
    data: result,
  });
});

const completeSettlement = catchAsync(async (req: Request, res: Response) => {
  const result = await SettlementService.completeSettlement(
    String(req.params.settlementId),
    req.user!.userId,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Settlement marked as completed",
    data: result,
  });
});

export const SettlementController = {
  listSettlements,
  createSettlement,
  completeSettlement,
};
