import express from "express";
import { getChilds } from "../controller/clients/getClients.js";
import { registerUser } from "../controller/registrationController.js";
import { getDashboard } from "../controller/getDashboard.js";
import { generateUserCommission } from "../controller/generateCommissionUser.js";
import { getCommisionLimits } from "../controller/commisionController/getCommisionLimits.js";
import { blockGames } from "../controller/blockController/blockGames.js";
import { getUserById } from "../controller/userController/getUserById.js";
import { updateUserDetails } from "../controller/userController/updateUserDetail.js";
import { getGameTypes } from "../controller/gameController/getGameTypes.js";
import { getGamesByType } from "../controller/gameController/getGamesByType.js";
// import { exposureController } from "../controller/exposureController.js";
// import { getProfitLoss } from "../controller/profitLossController.js";
// import { createInOutEntry } from "../controller/inOutController.js";
// import { inOutReport } from "../controller/inOutReport.js";
// import {
//   gameBlock,
//   getBlockedGames,
// } from "../controller/blockController/gameBlock.js";
import { setBlocking } from "../controller/blockController/setUserBlockStatus.js";
import { getBlockedUsers } from "../controller/blockController/getBlockedUsers.js";
// import { payCash } from "../controller/cashCollection/payCash.js";
// import { receiveCash } from "../controller/cashCollection/receiveCash.js";
import {
  changePassword,
  changeUserPassword,
} from "../controller/passwordController/index.js";

const router = express.Router();

router.get("/childs", getChilds); // http://localhost:4320/auth-api/panel/childs
router.get("/childs/:userId", getChilds); // http://localhost:4320/auth-api/panel/childs

router.post("/gameBlock", blockGames);

router.get("/generate-user-id", generateUserCommission); // http://localhost:4320/auth-api/panel/generate-user-id
router.post("/register-user", registerUser); // http://localhost:4320/auth-api/panel/register-user
router.get("/dashboard", getDashboard); // http://localhost:4320/auth-api/panel/dashboard
router.get("/commission-limits", getCommisionLimits);
router.get("/user/:id", getUserById); 
router.put("/users/:id", updateUserDetails);
router.get("/games/types", getGameTypes);
router.get("/games/:gameType", getGamesByType); 

// /auth-api/panel/commissionLimits
// router.get("/exposure/:userId", exposureController);
// router.get("/profit-loss", getProfitLoss);
// router.post("/inout", createInOutEntry);
// router.get("/inout", inOutReport);
// router.post("/gameBlock", gameBlock);
// router.get("/blockedGames", getBlockedGames);
router.post("/blockUser", setBlocking);
router.get("/blocked", getBlockedUsers);
// router.post("/payCash", payCash);
// router.post("/receiveCash", receiveCash);
router.post("/change_password", changePassword);
router.post("/change-password", changePassword); // User Changes Own Password
router.post("/user/change-password", changeUserPassword); // Parent Changes Child's Password
router.post("/changeUserPassword/:userId", changeUserPassword);

export default router;
