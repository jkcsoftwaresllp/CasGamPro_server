import { eq, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { users } from "../../database/schema.js";
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

  const { firstName, lastName, blockingLevels } = req.body;

  console.log({ firstName, lastName, blockingLevels });

  try {
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

    // Update the users table
    await db
      .update(users)
      .set({
        firstName: firstName ?? user[0].firstName,
        lastName: lastName ?? user[0].lastName,
        blocking_levels: blockingLevels ?? user[0].blocking_levels,
      })
      .where(eq(users.id, userId));

    let successResponse = {
      uniqueCode: "CGP0043",
      message: "User details updated successfully",
      data: {},
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
