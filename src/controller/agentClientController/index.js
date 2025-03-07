import { getClients } from "../agentClientController/getClients.js";
import { updatePlayerDetails } from "../agentClientController/updatePlayerDetails.js";
import { registerClient } from "../agentClientController/registerClient.js";
import { getDashboard } from "./getDashboard.js";
import { getCollectionReport } from "./generateCollectionReport.js";
import { paymentController } from "./paymentController.js";
import { getBlockedClients } from "./getBlockedClients.js";
import { getUserExposure } from "./getUserExposure.js";
import { getAgentExposure } from "./getAgentExposure.js";
export {
  getAgentExposure,
  getUserExposure,
  getClients,
  updatePlayerDetails,
  registerClient,
  getDashboard,
  getBlockedClients,
  getCollectionReport,
  paymentController,
};
