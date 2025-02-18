import { db } from "../../../config/db.js";
import { users, bets } from "../../../database/schema.js";
import { eq } from "drizzle-orm";
import {
  logToFolderError,
  logToFolderInfo,
} from "../../../utils/logToFolder.js";
import gameManager from "../../../services/shared/config/manager.js";

// Method to check if the bet can be placed, taking blocking levels into account
const checkBetBlocking = async (playerId) => {
  // Get the user's current blocking level
  const user = await db.select().from(users).where(eq(users.id, playerId));

  if (user.length === 0) {
    let errorLog = {
      uniqueCode: "CGP0131",
      message: "User not found",
      data: {},
    };
    logToFolderError("Agent/controller", "checkBetBlocking", errorLog);
    throw { status: 404, message: errorLog };
  }

  const blockingLevel = user[0].blocking_levels;

  // Handle different blocking levels for betting
  if (blockingLevel === "LEVEL_1") {
    let errorLog = {
      uniqueCode: "CGP0132",
      message: "Bet placing is not allowed for users with LEVEL_1 blocking",
      data: { playerId, blockingLevel },
    };
    logToFolderError("Agent/controller", "checkBetBlocking", errorLog);
    throw { status: 403, message: errorLog };
  }

  if (blockingLevel === "LEVEL_2") {
    let errorLog = {
      uniqueCode: "CGP0133",
      message: "Bet placing is not allowed for users with LEVEL_2 blocking",
      data: { playerId, blockingLevel },
    };
    logToFolderError("Agent/controller", "checkBetBlocking", errorLog);
    throw { status: 403, message: errorLog };
  }

  if (blockingLevel === "LEVEL_3") {
    let errorLog = {
      uniqueCode: "CGP0135",
      message: "Bet placing is not allowed for users with LEVEL_3 blocking",
      data: { playerId, blockingLevel },
    };
    logToFolderError("Agent/controller", "checkBetBlocking", errorLog);
    throw { status: 403, message: errorLog };
  }

  return true;
};

// Place the bet
export const placeBet = async (req, res) => {
  try {
    const { roundId, amount, side } = req.body;
    const userId = req.session.userId;

    // Check if the user is allowed to place the bet based on blocking levels
    await checkBetBlocking(userId);

    // Proceed with placing the bet
    const result = await gameManager.placeBet(userId, roundId, amount, side);

    // Log the successful bet placement
    let successLog = {
      uniqueCode: "CGP0136",
      message: `Bet placed successfully for player ${userId}`,
      data: { userId, amount, roundId, side },
    };
    logToFolderInfo("Agent/controller", "placeBet", successLog);

    res.json(result);
  } catch (error) {
    // If error has a custom status (e.g., blocking error), send the error response
    if (error.status && error.message) {
      return res.status(error.status).json(error.message);
    }

    // Handle unexpected errors
    res.status(400).json({
      uniqueCode: error.uniqueCode || "CGP00G10",
      message: error.message,
      data: error.data || { success: false },
    });
  }
};

// Add method to get valid bet options for a game
export const getValidBetOptions = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = gameManager.getGameById(gameId);

    if (!game) {
      return res.status(404).json({
        uniqueCode: "CGP00G07",
        message: "Game not found",
        data: {
          success: false,
          error: "Game not found",
        },
      });
    }

    res.json({
      uniqueCode: "CGP00G08",
      message: "Bet options retrieved successfully",
      data: {
        success: true,
        options: game.getValidBetOptions(),
      },
    });
  } catch (error) {
    res.status(500).json({
      uniqueCode: "CGP00G09",
      message: "Failed to get bet options",
      data: {
        success: false,
        error: "Failed to get bet options",
      },
    });
  }
};
