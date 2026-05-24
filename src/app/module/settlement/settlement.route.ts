import { Router } from "express";
import { Role } from "../../lib/prisma-exports";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { SettlementController } from "./settlement.controller";
import { createSettlementZodSchema } from "./settlement.validation";

const router = Router({ mergeParams: true });
const memberRoles = [Role.USER, Role.ADMIN, Role.SUPER_ADMIN] as const;

router.get("/", checkAuth(...memberRoles), SettlementController.listSettlements);

router.post(
  "/",
  checkAuth(...memberRoles),
  validateRequest(createSettlementZodSchema),
  SettlementController.createSettlement,
);

export const SettlementRoute = router;
