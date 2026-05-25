import { Router } from "express";
import { Role } from "../../lib/prisma-exports";
import { checkAuth } from "../../middleware/checkAuth";
import { UserController } from "./user.controller";

const router = Router();
const userRoles = [Role.USER] as const;

router.get("/lookup", checkAuth(...userRoles), UserController.lookupByEmail);

export const UserRoute = router;
