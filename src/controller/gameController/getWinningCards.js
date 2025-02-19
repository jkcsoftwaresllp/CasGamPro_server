import { db } from "../../config/db.js";
import { rounds } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { GAME_CONFIGS } from "../../services/shared/config/types.js";

export const getWinningCards = async (req, res) => {
  try {
    const { gameId, roundId } = req.params;

    if (!gameId || !roundId) {
      return res.status(400).json({
        uniqueCode: "CGP0032",
        message: "Game ID and Round ID are required",
        data: {
          success: false
        }
      });
    }

    // Find game config to get the game type
    const gameConfig = GAME_CONFIGS.find(config => config.id === gameId);
    if (!gameConfig) {
      return res.status(404).json({
        uniqueCode: "CGP0033",
        message: "Invalid game ID",
        data: {
          success: false
        }
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
          success: false
        }
      });
    }

    const round = roundData[0];

    // Parse JSON strings from database
    const playerA = JSON.parse(round.playerA || "[]");
    const playerB = JSON.parse(round.playerB || "[]");
    const playerC = JSON.parse(round.playerC || "[]");
    const winner = JSON.parse(round.winner || "null");

    // Format the response based on the game type
    let winningCards;
    switch (gameConfig.type) {
      case "DRAGON_TIGER":
        winningCards = {
          blindCard: round.blindCard,
          dragonCard: playerA[0], // Dragon cards are in playerA
          tigerCard: playerB[0],  // Tiger cards are in playerB
          winner
        };
        break;

      case "TEEN_PATTI":
        winningCards = {
          blindCard: round.blindCard,
          player1Cards: playerA,
          player2Cards: playerB,
          winner
        };
        break;

      case "LUCKY7B":
        winningCards = {
          blindCard: round.blindCard,
          mainCard: playerA[0],
          winner
        };
        break;

      case "ANDAR_BAHAR":
      case "ANDAR_BAHAR_TWO":
        winningCards = {
          jokerCard: round.jokerCard,
          andarCards: playerA,  // Andar cards are in playerA
          baharCards: playerB,  // Bahar cards are in playerB
          winner
        };
        break;

      case "DRAGON_TIGER_LION":
        winningCards = {
          blindCard: round.blindCard,
          dragonCard: playerA[0],
          tigerCard: playerB[0],
          lionCard: playerC[0],
          winner
        };
        break;

      default:
        return res.status(400).json({
          uniqueCode: "CGP0035",
          message: "Unsupported game type",
          data: {
            success: false
          }
        });
    }

    res.status(200).json({
      uniqueCode: "CGP00G14",
      message: "Winning cards retrieved successfully",
      data: {
        success: true,
        gameType: gameConfig.type,
        roundId,
        winningCards
      }
    });

  } catch (error) {
    logger.error("Error retrieving winning cards:", error);
    res.status(500).json({
      uniqueCode: "CGP00G15",
      message: "Failed to retrieve winning cards",
      data: {
        success: false,
        error: error.message
      }
    });
  }
}