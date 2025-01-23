import redis from "../../config/redis.js";
import { logger } from "../../logger/logger.js";

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

    // Get game history from Redis
    const gameKey = `game:${gameId}:${roundId}`;
    const gameData = await redis.hgetall(gameKey);

    if (!gameData || Object.keys(gameData).length === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0033",
        message: "Game round not found",
        data: {
          success: false
        }
      });
    }

    // Format the response based on the game type
    let winningCards;
    if (gameData.gameType === "DragonTiger") {
      winningCards = {
        dragonBlindCard: gameData.dragonBlindCard,
        dragonCard: gameData.dragonCard,
        tigerBlindCard: gameData.tigerBlindCard,
        tigerCard: gameData.tigerCard,
        winner: gameData.winner
      };
    } else if (gameData.gameType === "TeenPatti") {
      winningCards = {
        blindCard: gameData.blindCard,
        player1Cards: JSON.parse(gameData.player1Cards || "[]"),
        player2Cards: JSON.parse(gameData.player2Cards || "[]"),
        winner: gameData.winner
      };
    } else if (gameData.gameType === "Lucky7B") {
      winningCards = {
        blindCard: gameData.blindCard,
        secondCard: gameData.secondCard,
        winner: gameData.winner
      };
    } else if (gameData.gameType === "AndarBahar") {
      winningCards = {
        jokerCard: gameData.jokerCard,
        andarCards: JSON.parse(gameData.andarCards || "[]"),
        baharCards: JSON.parse(gameData.baharCards || "[]"),
        winner: gameData.winner
      };
    }

    res.status(200).json({
      uniqueCode: "CGP00G14",
      message: "Winning cards retrieved successfully",
      data: {
        success: true,
        gameType: gameData.gameType,
        roundId: roundId,
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