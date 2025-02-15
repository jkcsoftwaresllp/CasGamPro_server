import gameManager from "../../../services/shared/config/manager.js";
import redis from "../../../config/redis.js";
import { validateBetAmount } from "./getBettingRange.js";

export const placeBet = async (req, res) => {
  try {
    const { roundId, amount, side } = req.body;

    console.log("received:", req.body);
    const userId = req.session.userId;

    const result = await gameManager.placeBet(userId, roundId, amount, side); // amount = stake

    res.json(result);
  } catch (error) {
    res.status(400).json({
      uniqueCode: error.uniqueCode || "CGP00G10",
      message: error.message,
      data: error.data || { success: false }
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
