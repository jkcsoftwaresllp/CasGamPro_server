import express from "express";
import {
  getClients,
  updatePlayerDetails,
  registerClient,
  getAgentDashboard,
  getCollectionReport,
  paymentController,
} from "../controller/agentClientController/index.js";
import { getCommisionLimits } from "../controller/commisionController/index.js";
import { exposureController } from "../controller/exposureController.js";
import {
  getAgentTransactions,
  createTransactionEntry,
} from "../controller/agentLedgerController.js";
import { createInOutEntry } from "../controller/agentInOutController.js";
import { getLiveCasinoReports } from "../controller/reportController/index.js";
import {
  getGameTypes,
  getGamesByType,
} from "../controller/gameController/index.js";
import {
  getWallet,
  walletTransaction,
} from "../controller/walletController/index.js";
import { getUserById } from "../controller/userController/getUserById.js";

const router = express.Router();

router.get("/players", getClients); //http://localhost:4320/auth-api/agent/players
router.post("/register-client", registerClient); //http://localhost:4320/auth-api/agent/register-client
router.put("/players/:id", updatePlayerDetails); //http://localhost:4320/auth-api/agent/players/:id

router.get("/commissionLimits", getCommisionLimits);
//localhost:4320/auth-api/agent/commissionLimits?startDate=2024-01-01&endDate=2024-01-31

router.get("/exposure/:userId", exposureController); //http://localhost:4320/auth-api/agent/exposure/2

router.get("/agentDashboard", getAgentDashboard); //http://localhost:4320/auth-api/agent/agentDashboard

router.get("/collection-report", getCollectionReport); //http://localhost:4320/auth-api/agent/collection-report
router.post("/collection-report", paymentController); //http://localhost:4320/auth-api/agent/collection-report

// Ledger routes
router.get("/ledger", getAgentTransactions);
router.post("/ledger", createTransactionEntry);

// In-Out routes
router.post("/inout", createInOutEntry);

// Game routes
router.get("/games/types", getGameTypes);
router.get("/games/:gameType", getGamesByType);

// Reports routes
router.get("/liveCasinoReports", getLiveCasinoReports);

//wallet routes
router.get("/user/wallet", getWallet); //http://localhost:4320/auth-api/client/user/wallet
//wallet transaction
router.post("/walletTransaction", walletTransaction); //http://localhost:4320/auth-api/client/walletTransaction

router.get("/user/:id", getUserById);
export default router;
