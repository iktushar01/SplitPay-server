import { Router } from "express";
import { Role } from "../../lib/prisma-exports";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { SettlementController } from "./settlement.controller";
import { settlementIdParamsSchema } from "./settlement.validation";

const router = Router();
const userRoles = [Role.USER] as const;

router.patch(
  "/:settlementId/complete",
  checkAuth(...userRoles),
  validateRequest(settlementIdParamsSchema, "params"),
  SettlementController.completeSettlement,
);

export const SettlementGlobalRoute = router;
