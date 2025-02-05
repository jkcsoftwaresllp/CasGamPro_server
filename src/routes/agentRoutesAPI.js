import express from "express";
import {
  getClients,
  updatePlayerDetails,
  registerClient,
} from "../controller/agentClientController/index.js";
import { getCommisionLimits } from "../controller/commisionController/index.js";
import { exposureController } from "../controller/exposureController.js";

const router = express.Router();

router.post("/register-client", registerClient); //register a new client for an agent

// Agent Routes
router.get("/players", getClients);
router.put("/players/:id", updatePlayerDetails);
//list of players managed by the agent

router.get("/commissionLimits", getCommisionLimits);
//localhost:4320/auth-api/agent/commissionLimits?startDate=2024-01-01&endDate=2024-01-31

router.get("/exposure/:userId", exposureController); //http://localhost:4320/auth-api/agent/exposure/2

export default router;
