import { db } from "../../config/db.js";
import { rounds } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../../logger/logger.js";

export const getWinningHistory = async (req, res) => {
  try {
    const { roundId } = req.params;

    if (!roundId) {
      return res.status(400).json({
        uniqueCode: "CGP0032",
        message: "Game ID and Round ID are required",
        data: {
          success: false,
        },
      });
    }

    // Fetch round data from database
    const roundData = await db
      .select()
      .from(rounds)
      .where(eq(rounds.roundId, roundId))
      .limit(1);

    if (!roundData || roundData.length === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0034",
        message: "Game round not found",
        data: {
          success: false,
        },
      });
    }

    const round = roundData[0];

    // console.log(round);
    // Parse JSON strings from database
    const playerA = JSON.parse(round.playerA);
    const playerB = JSON.parse(round.playerB);
    const playerC = JSON.parse(round.playerC);
    const winner = JSON.parse(round.winner);
    const gameId = round.gameId;
    const jokerCard = round.jokerCard;

    console.log({
      playerA,
      playerB,
      playerC,
      winner,
      gameId,
      roundId,
    });

    res.status(200).json({
      uniqueCode: "CGP00G14",
      message: "Winning cards retrieved successfully",
      data: {
        playerA,
        playerB,
        playerC,
        winner,
        gameId,
        roundId,
        jokerCard,
      },
    });
  } catch (error) {
    logger.error("Error retrieving winning cards:", error);
    res.status(500).json({
      uniqueCode: "CGP00G15",
      message: "Failed to retrieve winning cards",
      data: {
        success: false,
        error: error.message,
      },
    });
  }
};
