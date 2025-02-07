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

const router = express.Router();

router.get("/players", getClients); //http://localhost:4320/auth-api/agent/players
router.post("/register-client", registerClient); //http://localhost:4320/auth-api/agent/register-client
router.put("/players/:id", updatePlayerDetails);

router.get("/commissionLimits", getCommisionLimits);
//localhost:4320/auth-api/agent/commissionLimits?startDate=2024-01-01&endDate=2024-01-31

router.get("/exposure/:userId", exposureController); //http://localhost:4320/auth-api/agent/exposure/2

router.get("/agentDashboard", getAgentDashboard); //http://localhost:4320/auth-api/agent/agentDashboard

router.get("/collection-report", getCollectionReport); //http://localhost:4320/auth-api/agent/collection-report
router.post("/collection-report", paymentController); //http://localhost:4320/auth-api/agent/collection-report

router.get("/transactions", getAgentTransactions); //http://localhost:4320/auth-api/agent/transactions

export default router;
