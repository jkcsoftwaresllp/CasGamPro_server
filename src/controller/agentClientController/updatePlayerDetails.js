import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { players, users } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const updatePlayerDetails = async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    let errorResponse = {
      uniqueCode: "CGP0040",
      message: "User ID is required",
      data: {},
    };
    logToFolderError("Agent/controller", "updatePlayerDetails", errorResponse);
    return res.status(400).json(errorResponse);
  }

  const { firstName, lastName, currentLimit, agentBlocked, betsBlocked } =
    req.body;

  try {
    // Fetch the existing user
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

    // Fetch the existing player entry
    const player = await db
      .select()
      .from(players)
      .where(eq(players.userId, userId));

    if (!player.length) {
      let errorResponse = {
        uniqueCode: "CGP0042",
        message: "Player not found",
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

    // Prepare the update data for players table
    const playerUpdateData = {
      firstName: firstName ?? user[0].firstName,
      lastName: lastName ?? user[0].lastName,
      fixLimit: currentLimit ?? player[0].fixLimit,
      agentBlocked: agentBlocked ?? player[0].agentBlocked,
      betsBlocked: betsBlocked ?? player[0].betsBlocked,
    };

    // Update users table for firstName and lastName
    await db.update(users).set(playerUpdateData).where(eq(users.id, userId));

    await db
      .update(players)
      .set(playerUpdateData)
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
