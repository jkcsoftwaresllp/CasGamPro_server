import { eq, and } from "drizzle-orm";
import { db } from "../../config/db.js";
import { users, agents, players, superAgents } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

// Function to fetch agent details based on userId
const getAgentDetails = async (userId) => {
  return await db
    .select({ id: agents.id, superAgentId: agents.superAgentId })
    .from(agents)
    .where(eq(agents.userId, userId));
};

export const updateUserDetails = async (req, res) => {
  const userId = req.params.id; // The user being updated
  const requesterId = req.session.userId; // The user making the request

  if (!userId || !requesterId) {
    let errorResponse = {
      uniqueCode: "CGP0040",
      message: "User ID and Agent ID are required",
      data: {},
    };
    logToFolderError("Agent/controller", "updateUserDetails", errorResponse);
    return res.status(400).json(errorResponse);
  }

  const { firstName, lastName, blockingLevels } = req.body;

  try {
    // Fetch the requesting user from users table
    const requestingUser = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, requesterId));

    if (!requestingUser.length) {
      let errorResponse = {
        uniqueCode: "CGP0041",
        message: "Requesting user is not found",
        data: {},
      };
      logToFolderError("Agent/controller", "updateUserDetails", errorResponse);
      return res.status(404).json(errorResponse);
    }

    const requesterRole = requestingUser[0].role;

    // Fetch the target user agent
    const targetUser = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!targetUser.length) {
      let errorResponse = {
        uniqueCode: "CGP0209",
        message: "User not found",
        data: {},
      };
      logToFolderError("Agent/controller", "updateUserDetails", errorResponse);
      return res.status(404).json(errorResponse);
    }
    const targetUserRole = targetUser[0].role;

    // Authorization Check
    if (requesterRole === "SUPERAGENT" && targetUserRole === "AGENT") {
      const superAgent = await db
        .select({ id: superAgents.id })
        .from(superAgents)
        .where(eq(superAgents.userId, requesterId));

      if (!superAgent.length) {
        return res.status(403).json({
          uniqueCode: "CGP0305",
          message: "SuperAgent not found",
          data: {},
        });
      }

      const superAgentTableId = superAgent[0].id;
      const agentData = await getAgentDetails(userId);

      if (
        !agentData.length ||
        agentData[0].superAgentId !== superAgentTableId
      ) {
        let errorResponse = {
          uniqueCode: "CGP0300",
          message:
            "Permission denied. You can update only your assigned agents.",
          data: {},
        };
        logToFolderError("User/controller", "updateUserDetails", errorResponse);
        return res.status(403).json(errorResponse);
      }
    } else if (requesterRole === "AGENT" && targetUserRole === "PLAYER") {
      const agent = await getAgentDetails(requesterId);

      if (!agent.length) {
        return res.status(403).json({
          uniqueCode: "CGP0303",
          message: "Agent not found",
          data: {},
        });
      }

      const agentTableId = agent[0].id;
      const playerData = await db
        .select({ agentId: players.agentId })
        .from(players)
        .where(
          and(eq(players.userId, userId), eq(players.agentId, agentTableId))
        );

      if (!playerData.length) {
        let errorResponse = {
          uniqueCode: "CGP0301",
          message:
            "Permission denied. You can update only your assigned players.",
          data: {},
        };
        logToFolderError("User/controller", "updateUserDetails", errorResponse);
        return res.status(403).json(errorResponse);
      }
    } else {
      let errorResponse = {
        uniqueCode: "CGP0302",
        message: "Invalid operation.",
        data: {},
      };
      logToFolderError("User/controller", "updateUserDetails", errorResponse);
      return res.status(403).json(errorResponse);
    }

    // Update the users table
    await db
      .update(users)
      .set({
        firstName: firstName ?? targetUser[0].firstName,
        lastName: lastName ?? targetUser[0].lastName,
        blocking_levels: blockingLevels ?? targetUser[0].blocking_levels,
      })
      .where(eq(users.id, userId));

    let successResponse = {
      uniqueCode: "CGP0043",
      message: "User details updated successfully",
      data: {},
    };
    logToFolderInfo("Agent/controller", "updateUserDetails", successResponse);

    return res.status(200).json(successResponse);
  } catch (error) {
    let errorResponse = {
      uniqueCode: "CGP0044",
      message: "Error updating player details",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "updateUserDetails", errorResponse);
    return res.status(500).json(errorResponse);
  }
};
