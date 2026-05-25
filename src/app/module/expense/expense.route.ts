import { Router } from "express";
import { Role } from "../../lib/prisma-exports";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ExpenseController } from "./expense.controller";
import { createExpenseZodSchema } from "./expense.validation";

const router = Router({ mergeParams: true });
const userRoles = [Role.USER] as const;

router.get("/", checkAuth(...userRoles), ExpenseController.listExpenses);

router.post(
  "/",
  checkAuth(...userRoles),
  validateRequest(createExpenseZodSchema),
  ExpenseController.createExpense,
);

export const ExpenseRoute = router;
