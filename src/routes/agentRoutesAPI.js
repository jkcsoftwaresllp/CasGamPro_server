import express from "express";
import {
  getClients,
  updatePlayerDetails,
  registerClient,
} from "../controller/agentClientController/index.js";
import {
  getBettingRange,
  placeBet,
} from "../controller/gameController/index.js";

const router = express.Router();

router.post("/register-client", registerClient); //register a new client for an agent

// Agent Routes
router.get("/players", getClients);
router.put("/players/:id", updatePlayerDetails);
//list of players managed by the agent

router.get("/betting-range", getBettingRange); //http://localhost:4320/api/agent/betting-range
router.post("/place-bet", placeBet); //http://localhost:4320/api/agent/place-bet
export default router;
