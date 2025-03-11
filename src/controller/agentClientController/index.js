import { getClients } from "../agentClientController/getClients.js";
import { updateUserDetails } from "../agentClientController/updateUserDetails.js";
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
  updateUserDetails,
  registerClient,
  getDashboard,
  getBlockedClients,
  getCollectionReport,
  paymentController,
};
