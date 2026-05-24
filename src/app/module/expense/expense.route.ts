import { Router } from "express";
import { Role } from "../../lib/prisma-exports";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ExpenseController } from "./expense.controller";
import { createExpenseZodSchema } from "./expense.validation";

const router = Router({ mergeParams: true });
const memberRoles = [Role.USER, Role.ADMIN, Role.SUPER_ADMIN] as const;

router.get("/", checkAuth(...memberRoles), ExpenseController.listExpenses);

router.post(
  "/",
  checkAuth(...memberRoles),
  validateRequest(createExpenseZodSchema),
  ExpenseController.createExpense,
);

export const ExpenseRoute = router;
