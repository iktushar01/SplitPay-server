import express from "express";
import { AuthRoute } from "../module/auth/auth.route";
import { GroupRoute } from "../module/group/group.route";
import { SettlementGlobalRoute } from "../module/settlement/settlement.global.route";

const router = express.Router();

router.use("/auth", AuthRoute);
router.use("/groups", GroupRoute);
router.use("/settlements", SettlementGlobalRoute);

export const IndexRoute = router;
