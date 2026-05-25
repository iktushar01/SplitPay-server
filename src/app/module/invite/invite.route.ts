import { Router } from "express";
import { Role } from "../../lib/prisma-exports";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { inviteIdParamsSchema } from "../group/group.validation";
import { InviteController } from "./invite.controller";

const router = Router();
const userRoles = [Role.USER] as const;

router.get("/", checkAuth(...userRoles), InviteController.getMyInvites);

router.post(
  "/:inviteId/accept",
  checkAuth(...userRoles),
  validateRequest(inviteIdParamsSchema, "params"),
  InviteController.acceptInvite,
);

router.post(
  "/:inviteId/decline",
  checkAuth(...userRoles),
  validateRequest(inviteIdParamsSchema, "params"),
  InviteController.declineInvite,
);

export const InviteRoute = router;
