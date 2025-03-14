import express from "express";
import {
  getAgentExposure,
  getUserExposure,
  getClients,
  updateUserDetails,
  registerClient,
  getDashboard,
  getCollectionReport,
  getBlockedClients,
  paymentController,
} from "../controller/agentClientController/index.js";
import { getCommisionLimits } from "../controller/commisionController/index.js";
import { exposureController } from "../controller/exposureController.js";
import { getAgentTransactions } from "../controller/agentLedgerController.js";
import { createInOutEntry } from "../controller/agentInOutController.js";
import {
  getLiveCasinoReports,
  getLiveCasinoGameReports,
} from "../controller/reportController/index.js";
import {
  getGameTypes,
  getGamesByType,
} from "../controller/gameController/index.js";
import {
  getWallet,
  walletTransaction,
} from "../controller/walletController/index.js";
import { getProfitLoss } from "../controller/agentProfitLossController.js";
import { getUserById } from "../controller/userController/getUserById.js";
import { getClientSummary } from "../controller/agentClientSummaryController.js";
import { generateUserIdCommissionLimit } from "../controller/generateUserIdCommissionLimit.js";
import { checkBlockingLevel } from "../middleware/checkBlockingLevel.js";
import { inOutReport } from "../controller/inOutReport.js";
import { setClientBlocking } from "../controller/blockController/setClientBlockStatus.js";
import { receiveCash } from "../controller/cashCollection/receiveCash.js";
import { payCash } from "../controller/cashCollection/payCash.js";
import {
  changePassword,
  changeClientPassword,
} from "../controller/passwordController/index.js";
import {
  getCashLedger,
  getUserLedgerForAgent,
  getUserStatementForAgent,
} from "../controller/agentLedger/index.js";
import {
  gameBlock,
  getBlockedGames,
} from "../controller/blockController/gameBlock.js";
import { clientPL_API } from "../controller/clientLedger/clientPLAPI.js";

const router = express.Router();

router.post("/change_password", changePassword); //http://localhost:4320/auth-api/client/change_password
router.get("/players", getClients); //http://localhost:4320/auth-api/agent/players || http://localhost:4320/auth-api/agent/players?userId=5
router.post("/register-client", registerClient); //http://localhost:4320/auth-api/agent/register-client
router.put("/players/:id", updateUserDetails); //http://localhost:4320/auth-api/agent/players/:id
router.get("/user/:id", getUserById);

router.get("/commissionLimits", getCommisionLimits);
//localhost:4320/auth-api/agent/commissionLimits?startDate=2024-01-01&endDate=2024-01-31

router.get("/exposure/:userId", exposureController); //http://localhost:4320/auth-api/agent/exposure/2

router.get("/agentDashboard", getDashboard); //http://localhost:4320/auth-api/agent/agentDashboard

router.get("/collection-report", getCollectionReport); //http://localhost:4320/auth-api/agent/collection-report
router.post("/collection-report", paymentController); //http://localhost:4320/auth-api/agent/collection-report

// Ledger routes
router.get("/ledger", getAgentTransactions);

// In-Out routes
router.post("/inout", createInOutEntry);
router.get("/inout", inOutReport);

// Game routes
router.get("/games/types", checkBlockingLevel, getGameTypes);
router.get("/games/:gameType", checkBlockingLevel, getGamesByType);

// Reports routes
router.get("/liveCasinoReports", getLiveCasinoReports);
router.get("/games/livecasino/:categoryName/:date", getLiveCasinoGameReports);

//wallet routes
router.get("/user/wallet", getWallet); //http://localhost:4320/auth-api/agent/user/wallet
//wallet transaction
router.post("/walletTransaction", walletTransaction); //http://localhost:4320/auth-api/agent/walletTransaction

// Profit Loss
router.get("/profit-loss", getProfitLoss);

// Client summary route
router.get("/client-summary", getClientSummary);

router.get("/blocked", getBlockedClients); //http://localhost:4320/auth-api/agent/blocked
router.post("/blockClient", setClientBlocking); //http://localhost:4320/auth-api/agent/blockClient

router.get("/generateUserIdCommissionLimit", generateUserIdCommissionLimit); //http://localhost:4320/auth-api/agent/generateUserIdCommissionLimit

router.get("/user-exposure/:userId", getUserExposure); //http://localhost:4320/auth-api/agent/user-exposure/:userId
router.get("/agent-exposure/:userId", getAgentExposure); //http://localhost:4320/auth-api/agent/agent-exposure/:userId

router.post("/receiveCash", receiveCash); //http://localhost:4320/auth-api/agent/receiveCash

router.post("/payCash", payCash);
router.post("/change-password", changePassword); // Agent changes own password
router.post("/client/change-password", changeClientPassword); // Agent changes client's password

router.get("/userLedger/:userId", getUserLedgerForAgent); //http://localhost:4320/auth-api/agent/userLedger/:userId
router.get("/userStatementLedger/:userId", getUserStatementForAgent); //http://localhost:4320/auth-api/agent/userStatementLedger/:userId
router.get("/cashLedger/:userId", getCashLedger); //http://localhost:4320/auth-api/agent/cashLedger/:userId
router.get("/clientPL/:userId", clientPL_API); //http://localhost:4320/auth-api/client/clientPL

// Game blocking routes
router.post("/gameBlock", gameBlock);
router.get("/blockedGames", getBlockedGames); //http://localhost:4320/auth-api/agent/blockedGames
router.post("/changeClientPassword/:clientId", changeClientPassword); //http://localhost:4320/auth-api/agent/changeClientPassword/:clientId

export default router;
