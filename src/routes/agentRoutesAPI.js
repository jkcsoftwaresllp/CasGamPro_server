import express from "express";
import {
  getClients,
  updatePlayerDetails,
} from "../controller/agentClientController/index.js";

const router = express.Router();

// Agent Routes
router.get("/players", getClients);
router.put("/players/:id", updatePlayerDetails);
//list of players managed by the agent
export default router;
