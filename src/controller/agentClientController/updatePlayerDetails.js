import { eq, and } from "drizzle-orm";
import { db } from "../../config/db.js";
import { players, users, agents } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const updatePlayerDetails = async (req, res) => {
  const userId = req.params.id;
  const agentId = req.session.userId;

  if (!userId || !agentId) {
    let errorResponse = {
      uniqueCode: "CGP0040",
      message: "User ID and Agent ID are required",
      data: {},
    };
    logToFolderError("Agent/controller", "updatePlayerDetails", errorResponse);
    return res.status(400).json(errorResponse);
  }

  const { firstName, lastName, currentLimit, agentBlocked, betsBlocked } =
    req.body;

  try {
    // Check if the agent manages this player
    const player = await db
      .select()
      .from(players)
      .innerJoin(agents, eq(players.agentId, agents.id))
      .where(and(eq(players.userId, userId), eq(agents.userId, agentId)));

    if (player.length === 0) {
      let errorResponse = {
        uniqueCode: "CGP0041",
        message: "Player not found under this agent",
        data: {},
      };
      logToFolderError(
        "Agent/controller",
        "updatePlayerDetails",
        errorResponse
      );
      return res.status(404).json(errorResponse);
    }

    // Fetch the existing user from users table
    const user = await db.select().from(users).where(eq(users.id, userId));

    if (!user.length) {
      let errorResponse = {
        uniqueCode: "CGP0041",
        message: "User not found",
        data: {},
      };
      logToFolderError(
        "Agent/controller",
        "updatePlayerDetails",
        errorResponse
      );
      return res.status(404).json(errorResponse);
    }

    // Validate currentLimit if provided
    if (currentLimit !== undefined && isNaN(currentLimit)) {
      let errorResponse = {
        uniqueCode: "CGP0045",
        message: "Current Limit should be a valid number",
        data: {},
      };
      logToFolderError(
        "Agent/controller",
        "updatePlayerDetails",
        errorResponse
      );
      return res.status(400).json(errorResponse);
    }

    // Get the current blocking levels from the USERS table
    const currentAgentBlockedLevel = user[0].blocking_levels;
    const currentBetsBlockedLevel = user[0].blocking_levels;

    // Toggle logic based on the current blocking levels
    const updatedAgentBlocked =
      agentBlocked !== undefined
        ? currentAgentBlockedLevel === "LEVEL_1"
          ? "NONE"
          : "LEVEL_1"
        : currentAgentBlockedLevel;

    const updatedBetsBlocked =
      betsBlocked !== undefined
        ? currentBetsBlockedLevel === "LEVEL_2"
          ? "NONE"
          : "LEVEL_2"
        : currentBetsBlockedLevel;

    // Prepare the update data
    const playerUpdateData = {
      firstName: firstName ?? user[0].firstName,
      lastName: lastName ?? user[0].lastName,
      fixLimit: currentLimit ?? player[0].fixLimit,
      agentBlocked: updatedAgentBlocked,
      betsBlocked: updatedBetsBlocked,
    };

    // Update the users table
    await db
      .update(users)
      .set({
        firstName,
        lastName,
        // blocking_levels: updatedAgentBlocked,
      })
      .where(eq(users.id, userId));

    // Update the players table
    await db
      .update(players)
      .set({
        fixLimit: playerUpdateData.fixLimit,
        // agentBlocked: updatedAgentBlocked,
        // betsBlocked: updatedBetsBlocked,
      })
      .where(eq(players.userId, userId));

    let successResponse = {
      uniqueCode: "CGP0043",
      message: "User and player details updated successfully",
      data: { Client: playerUpdateData },
    };
    logToFolderInfo("Agent/controller", "updatePlayerDetails", successResponse);

    return res.status(200).json(successResponse);
  } catch (error) {
    let errorResponse = {
      uniqueCode: "CGP0044",
      message: "Error updating player details",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "updatePlayerDetails", errorResponse);
    return res.status(500).json(errorResponse);
  }
};
