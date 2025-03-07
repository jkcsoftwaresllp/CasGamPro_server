import express from "express";
import {
    changePassword,
    changeAgentPassword
} from "../controller/passwordController/index.js";
import { 
    createAgentInOutEntry,
    getAgentInOutReport 
  } from './superAgentInOutController.js';
  import { 
    getAgentTransactions,
    createAgentTransactionEntry 
  } from './superAgentLedgerController.js';
  import { getAgentProfitLoss } from './superAgentProfitLossController.js';

const router = express.Router();

// change password
router.post("/change-password", changePassword); // Super agent changes own password
router.post("/agent/change-password", changeAgentPassword); // Super agent changes agent's password
// In-Out routes
router.post('/inout', createAgentInOutEntry);
router.get('/inout', getAgentInOutReport);
// company len/den
router.get('/ledger', getAgentTransactions);
router.post('/ledger', createAgentTransactionEntry);
// profit loss
router.get('/profit-loss', getAgentProfitLoss);

export default router;