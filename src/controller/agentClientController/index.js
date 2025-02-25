import { getClients } from "../agentClientController/getClients.js";
import { updatePlayerDetails } from "../agentClientController/updatePlayerDetails.js";
import { registerClient } from "../agentClientController/registerClient.js";
import { getAgentDashboard } from "./getAgentDashboard.js";
import { getCollectionReport } from "./generateCollectionReport.js";
import { paymentController } from "./paymentController.js";
import { getBlockedClients } from "./getBlockedClients.js";
export {
  getClients,
  updatePlayerDetails,
  registerClient,
  getAgentDashboard,
  getBlockedClients,
  getCollectionReport,
  paymentController,
};
