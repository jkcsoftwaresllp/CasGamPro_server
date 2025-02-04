import express from "express";
import {
  getClients,
  updatePlayerDetails,
  registerClient,
} from "../controller/agentClientController/index.js";


const router = express.Router();

router.post("/register-client", registerClient); //register a new client for an agent

// Agent Routes
router.get("/players", getClients);
router.put("/players/:id", updatePlayerDetails);
//list of players managed by the agent


export default router;
