import {
  getUserById,
  getClientsByParent,
} from "../../database/queries/users/sqlGetUsers.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";
import { filterUtils } from "../../utils/filterUtils.js";
import { getPaginationParams } from "../../utils/paginationUtils.js";
import { createResponse } from "../../helper/responseHelper.js"; // Import the response helper

export const getClients = async (req, res) => {
  try {
    const userId = req.session?.userId;
    const { limit, offset } = req.query;

    if (!userId) {
      const errorResponse = createResponse("error", "CGP0001", "Unauthorized");
      logToFolderError("Agent/controller", "getClients", errorResponse);
      return res.status(401).json(errorResponse);
    }

    // Fetch user details
    const user = await getUserById(userId);
    if (!user) {
      const errorResponse = createResponse(
        "error",
        "CGP0002",
        "User not found"
      );
      logToFolderError("Agent/controller", "getClients", errorResponse);
      return res.status(404).json(errorResponse);
    }

    // Ensure user has the correct role
    if (!["AGENT", "SUPERAGENT"].includes(user.role)) {
      const errorResponse = createResponse(
        "error",
        "CGP0003",
        "Not authorized as agent or super agent"
      );
      logToFolderError("Agent/controller", "getClients", errorResponse);
      return res.status(403).json(errorResponse);
    }

    // Get valid pagination parameters
    const { limit: recordsLimit, offset: recordsOffset } = getPaginationParams(
      limit,
      offset
    );

    // Generate dynamic query filters
    const filters = filterUtils(req.query);

    // Fetch clients with additional details
    const clients = await getClientsByParent(
      user.id,
      user.role,
      recordsLimit,
      recordsOffset,
      filters
    );

    if (!clients.length) {
      const noDataResponse = createResponse(
        "success",
        "CGP0004",
        "No clients found",
        { results: [] }
      );
      logToFolderInfo("Agent/controller", "getClients", noDataResponse);
      return res.status(200).json(noDataResponse);
    }

    const successResponse = createResponse(
      "success",
      "CGP0005",
      "Clients retrieved successfully",
      { results: clients }
    );

    logToFolderInfo("Agent/controller", "getClients", successResponse);
    return res.status(200).json(successResponse);
  } catch (error) {
    const errorResponse = createResponse(
      "error",
      "CGP0006",
      "Internal server error",
      { error: error.message }
    );

    logToFolderError("Agent/controller", "getClients", errorResponse);
    return res.status(500).json(errorResponse);
  }
};
