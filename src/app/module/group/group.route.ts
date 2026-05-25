import { Router } from "express";
import { Role } from "../../lib/prisma-exports";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ExpenseRoute } from "../expense/expense.route";
import { SettlementRoute } from "../settlement/settlement.route";
import { GroupController } from "./group.controller";
import {
  addGroupMemberZodSchema,
  createGroupZodSchema,
  groupIdParamsSchema,
} from "./group.validation";

const router = Router();
const userRoles = [Role.USER] as const;

router.post(
  "/",
  checkAuth(...userRoles),
  validateRequest(createGroupZodSchema),
  GroupController.createGroup,
);

router.get("/", checkAuth(...userRoles), GroupController.getMyGroups);

router.get(
  "/:groupId",
  checkAuth(...userRoles),
  validateRequest(groupIdParamsSchema, "params"),
  GroupController.getGroupById,
);

router.get(
  "/:groupId/dashboard",
  checkAuth(...userRoles),
  validateRequest(groupIdParamsSchema, "params"),
  GroupController.getDashboard,
);

router.post(
  "/:groupId/members",
  checkAuth(...userRoles),
  validateRequest(groupIdParamsSchema, "params"),
  validateRequest(addGroupMemberZodSchema),
  GroupController.addMember,
);

router.use("/:groupId/expenses", ExpenseRoute);
router.use("/:groupId/settlements", SettlementRoute);

export const GroupRoute = router;
