import express from "express";
import { getClients } from "../controller/clients/getClients";
import { registerUser } from "../controller/registrationController";
import { getDashboard } from "../controller/getDashboard";
import { exposureController } from "../controller/exposureController";
import { getProfitLoss } from "../controller/profitLossController";
import { createInOutEntry } from "../controller/inOutController";
import { inOutReport } from "../controller/inOutReport";
import { gameBlock, getBlockedGames } from "../controller/blockController/gameBlock";
import { setUserBlockStatus } from "../controller/blockController/setUserBlockStatus";
import { payCash } from "../controller/cashCollection/payCash";
import { receiveCash } from "../controller/cashCollection/receiveCash";
import { changePassword, changeUserPassword } from "../controller/passwordController";

const router = express.Router();

router.get("/clients", getClients);

router.post("/register-user", registerUser);
router.get("/dashboard", getDashboard);
router.get("/exposure/:userId", exposureController);
router.get("/profit-loss", getProfitLoss);
router.post("/inout", createInOutEntry);
router.get("/inout", inOutReport);
router.post("/gameBlock", gameBlock);
router.get("/blockedGames", getBlockedGames);
router.post("/blockUser", setUserBlockStatus);
router.post("/payCash", payCash);
router.post("/receiveCash", receiveCash);
router.post("/change_password", changePassword);
router.post("/change-password", changePassword); // User Changes Own Password
router.post("/user/change-password", changeUserPassword); // Parent Changes Child's Password
router.post("/changeUserPassword/:userId", changeUserPassword);

export default router;
