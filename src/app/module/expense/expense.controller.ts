import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ExpenseService } from "./expense.service";

const listExpenses = catchAsync(async (req: Request, res: Response) => {
  const { userId, from, to } = req.query;
  const filters: { userId?: string; from?: Date; to?: Date } = {};
  if (typeof userId === "string") filters.userId = userId;
  if (typeof from === "string") filters.from = new Date(from);
  if (typeof to === "string") filters.to = new Date(to);

  const result = await ExpenseService.listExpenses(
    String(req.params.groupId),
    req.user!.userId,
    filters,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    data: result,
  });
});

const createExpense = catchAsync(async (req: Request, res: Response) => {
  const result = await ExpenseService.createExpense(
    String(req.params.groupId),
    req.user!.userId,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Expense recorded",
    data: result,
  });
});

export const ExpenseController = {
  listExpenses,
  createExpense,
};
