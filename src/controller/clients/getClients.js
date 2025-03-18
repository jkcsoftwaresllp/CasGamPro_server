import {
  getUserById,
  getChildsByParent,
} from "../../database/queries/users/sqlGetUsers.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

import { createResponse } from "../../helper/responseHelper.js"; // Import the response helper
import { ROLES } from "../../database/schema.js";

export const getChilds = async (req, res) => {
  try {
    const ownerId = req.session.userId;
    const { userId = null } = req.body;
    const { limit, offset } = req.query;

    const usedId = userId ? ownerId : userId;
    /**
     *
     * Admin      -> id: , parentId:
     * SuperAgent -> id: , parentId:
     * Agent      -> id: , parentId:
     * Client     -> id: , parentId:
     *
     *  users table all the entriies where parent id is usedId
     *
     */

    // Fetch user details
    const user = await getUserById(usedId);

    if (!user) {
      const errorResponse = createResponse(
        "error",
        "CGP0002",
        "User not found, therefore unable find the childs"
      );
      logToFolderError("Agent/controller", "getClients", errorResponse);
      return res.status(404).json(errorResponse);
    }

    // Ensure user has the correct role
    if (ROLES[3] === user.role) {
      const errorResponse = createResponse(
        "error",
        "CGP0003",
        "Not authorized"
      );
      logToFolderError("Agent/controller", "getClients", errorResponse);
      return res.status(403).json(errorResponse);
    }

    let clients = [];

    clients = await getChildsByParent(user.id);

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
