import express from "express";
import { getChilds } from "../controller/clients/getClients.js";
import { registerUser } from "../controller/registrationController.js";
import { getDashboard } from "../controller/getDashboard.js";
import { generateUserCommission } from "../controller/generateCommissionUser.js";
// import { exposureController } from "../controller/exposureController.js";
// import { getProfitLoss } from "../controller/profitLossController.js";
// import { createInOutEntry } from "../controller/inOutController.js";
// import { inOutReport } from "../controller/inOutReport.js";
// import {
//   gameBlock,
//   getBlockedGames,
// } from "../controller/blockController/gameBlock.js";
// import { setUserBlockStatus } from "../controller/blockController/setUserBlockStatus.js";
// import { payCash } from "../controller/cashCollection/payCash.js";
// import { receiveCash } from "../controller/cashCollection/receiveCash.js";
// import {
//   changePassword,
//   changeUserPassword,
// } from "../controller/passwordController/index.js";

const router = express.Router();

router.get("/childs", getChilds); // http://localhost:4320/auth-api/panel/childs
router.get("/childs/:userId", getChilds); // http://localhost:4320/auth-api/panel/childs

router.get("/generate-user-id", generateUserCommission); // http://localhost:4320/auth-api/panel/generate-user-id
router.post("/register-user", registerUser); // http://localhost:4320/auth-api/panel/register-user
router.get("/dashboard", getDashboard); // http://localhost:4320/auth-api/panel/dashboard
// router.get("/exposure/:userId", exposureController);
// router.get("/profit-loss", getProfitLoss);
// router.post("/inout", createInOutEntry);
// router.get("/inout", inOutReport);
// router.post("/gameBlock", gameBlock);
// router.get("/blockedGames", getBlockedGames);
// router.post("/blockUser", setUserBlockStatus);
// router.post("/payCash", payCash);
// router.post("/receiveCash", receiveCash);
// router.post("/change_password", changePassword);
// router.post("/change-password", changePassword); // User Changes Own Password
// router.post("/user/change-password", changeUserPassword); // Parent Changes Child's Password
// router.post("/changeUserPassword/:userId", changeUserPassword);

export default router;
