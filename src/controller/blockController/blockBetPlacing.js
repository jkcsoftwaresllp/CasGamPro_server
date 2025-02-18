import { db } from "../../config/db.js";
import { users, bets } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const blockBetPlacing = async (req, res) => {
  try {
    const { playerId, betAmount, roundId, betSide } = req.body;

    // Validate input
    if (!playerId || !betAmount || !roundId || !betSide) {
      let errorLog = {
        uniqueCode: "CGP0130",
        message: "Player ID, bet amount, round ID, and bet side are required",
        data: {},
      };
      logToFolderError("Agent/controller", "blockBetPlacing", errorLog);
      return res.status(400).json(errorLog);
    }

    // Get the user's current blocking level
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, playerId));

    if (user.length === 0) {
      let errorLog = {
        uniqueCode: "CGP0131",
        message: "User not found",
        data: {},
      };
      logToFolderError("Agent/controller", "blockBetPlacing", errorLog);
      return res.status(404).json(errorLog);
    }

    const blockingLevel = user[0].blocking_levels;

    // Handle different blocking levels for betting

    // LEVEL_1: Completely blocked, no bet allowed
    if (blockingLevel === "LEVEL_1") {
      let errorLog = {
        uniqueCode: "CGP0132",
        message: "Bet placing is not allowed for users with LEVEL_1 blocking",
        data: { playerId, blockingLevel },
      };
      logToFolderError("Agent/controller", "blockBetPlacing", errorLog);
      return res.status(403).json(errorLog);
    }

    // LEVEL_2: Can view but cannot place bets
    if (blockingLevel === "LEVEL_2") {
      let errorLog = {
        uniqueCode: "CGP0133",
        message: "Bet placing is not allowed for users with LEVEL_2 blocking",
        data: { playerId, blockingLevel },
      };
      logToFolderError("Agent/controller", "blockBetPlacing", errorLog);
      return res.status(403).json(errorLog);
    }

    // LEVEL_3: Can neither place bets nor play games
    if (blockingLevel === "LEVEL_3") {
      let errorLog = {
        uniqueCode: "CGP0135",
        message: "Bet placing is not allowed for users with LEVEL_3 blocking",
        data: { playerId, blockingLevel },
      };
      logToFolderError("Agent/controller", "blockBetPlacing", errorLog);
      return res.status(403).json(errorLog);
    }

    // If the blocking level allows, proceed to place the bet
    await db
      .insert(bets)
      .values({
        roundId,
        playerId,
        betAmount,
        betSide,
        win: null, // The result will be updated later
      });

    let successLog = {
      uniqueCode: "CGP0136",
      message: `Bet placed successfully for player ${playerId}`,
      data: { playerId, betAmount, roundId, betSide },
    };
    logToFolderInfo("Agent/controller", "blockBetPlacing", successLog);

    return res.status(200).json(successLog);
  } catch (error) {
    let errorLog = {
      uniqueCode: "CGP0137",
      message: "Internal server error",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "blockBetPlacing", errorLog);
    return res.status(500).json(errorLog);
  }
};
