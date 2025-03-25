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
import { exposureController } from "../controller/exposureController.js";
import { getUserExposure } from "../controller/parentChildController/getUserExposure.js";
import { getCashLedger } from "../controller/parentLedger/getCashLedger.js";
import { getUserLedgerForParent } from "../controller/parentLedger/getChildLedgerForParent.js";
import { getUserStatementForParent } from "../controller/parentLedger/getChildStatementForParent.js";
import { clientPL_API } from "../controller/clientLedger/clientPLAPI.js";
import { getProfitLoss } from "../controller/profitLossController.js";
import { createInOutEntry } from "../controller/inOutController.js";
import { getParentTransactions } from "../controller/parentLedgerController.js";
import { getCollectionReport } from "../controller/parentChildController/generateCollectionReport.js";
import { getLiveCasinoReports } from "../controller/reportController/index.js";
import { getLiveCasinoGameReports } from "../controller/reportController/index.js";
// import {
//   gameBlock,
//   getBlockedGames,
// } from "../controller/blockController/gameBlock.js";
import { setBlocking } from "../controller/blockController/setUserBlockStatus.js";
import { getBlockedUsers } from "../controller/blockController/getBlockedUsers.js";
import { walletTransaction } from "../controller/walletController/walletTransaction.js";
import { exposureTransaction } from "../controller/cashCollection/exposureTransaction.js";
import {
  changePassword,
  changeUserPassword,
} from "../controller/passwordController/index.js";
import { unblockGame } from "../controller/gameController/unblockGame.js";
import { checkPlayerCanPlay } from "../controller/blockController/checkPlayerCanPlay.js";
const router = express.Router();

router.get("/childs", getChilds); // http://localhost:4320/auth-api/panel/childs
router.get("/childs/:userId", getChilds); // http://localhost:4320/auth-api/panel/childs

router.post("/gameBlock", blockGames); //
router.post("/unblockGame", unblockGame); //

router.get("/generate-user-id", generateUserCommission); // http://localhost:4320/auth-api/panel/generate-user-id
router.post("/register-user", registerUser); // http://localhost:4320/auth-api/panel/register-user
router.get("/dashboard", getDashboard); // http://localhost:4320/auth-api/panel/dashboard
router.get("/commission-limits", getCommisionLimits); //
router.get("/user/:id", getUserById); //
router.put("/users/:id", updateUserDetails); //
router.get("/games/types", getGameTypes); //
router.get("/games/:gameType", getGamesByType); //
router.post("/walletTransaction", walletTransaction);

router.get("/exposure/:userId", exposureController);
router.get("/profit-loss", getProfitLoss);
router.post("/inout", createInOutEntry);
// router.post("/gameBlock", gameBlock);
// router.get("/blockedGames", getBlockedGames);
router.post("/blockUser", setBlocking);
router.get("/checkPlayerStatus/:gameId", checkPlayerCanPlay);
router.get("/blocked", getBlockedUsers);
router.post("/exposure-transection", exposureTransaction);
router.post("/change_password", changePassword);
router.post("/change-password", changePassword); // User Changes Own Password
router.post("/user/change-password", changeUserPassword); // Parent Changes Child's Password
router.post("/changeUserPassword/:userId", changeUserPassword);

router.get("/get-coins-exposure/:userId", getUserExposure);

router.get("/cashLedger/:userId", getCashLedger);
router.get("/userLedger/:userId", getUserLedgerForParent);
router.get("/userStatementLedger/:userId", getUserStatementForParent);
router.get("/clientPL/:userId", clientPL_API);

router.get("/ledger", getParentTransactions);

router.get("/collection-report", getCollectionReport);

router.get("/liveCasinoReports", getLiveCasinoReports);
router.get("/games/livecasino/:categoryName/:date", getLiveCasinoGameReports);

export default router;
