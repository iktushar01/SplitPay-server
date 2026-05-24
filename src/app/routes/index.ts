import express from "express";
import { AuthRoute } from "../module/auth/auth.route";
import { GroupRoute } from "../module/group/group.route";
import { SettlementGlobalRoute } from "../module/settlement/settlement.global.route";
import { UserRoutes } from "../module/user/user.route";

const router = express.Router();

router.use("/auth", AuthRoute);
router.use("/users", UserRoutes);
router.use("/groups", GroupRoute);
router.use("/settlements", SettlementGlobalRoute);

export const IndexRoute = router;
