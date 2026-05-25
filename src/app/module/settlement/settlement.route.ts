import { Router } from "express";
import { Role } from "../../lib/prisma-exports";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { SettlementController } from "./settlement.controller";
import { createSettlementZodSchema } from "./settlement.validation";

const router = Router({ mergeParams: true });
const userRoles = [Role.USER] as const;

router.get("/", checkAuth(...userRoles), SettlementController.listSettlements);

router.post(
  "/",
  checkAuth(...userRoles),
  validateRequest(createSettlementZodSchema),
  SettlementController.createSettlement,
);

export const SettlementRoute = router;
