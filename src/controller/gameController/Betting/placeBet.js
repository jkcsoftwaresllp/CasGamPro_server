import gameManager from "../../../services/shared/config/manager.js";
import redis from "../../../config/redis.js";
import { validateBetAmount } from "./getBettingRange.js";

export const placeBet = async (req, res) => {
  try {
    const { gameId, side, amount } = req.body;

    const userId = req.session.userId;
    const username = req.session.username;

    // Get specific game by ID instead of first game
    const game = gameManager.getGameById(gameId);

    if (!game) {
      return res.status(404).json({
        uniqueCode: "CGP00G03",
        message: "Game not found",
        data: {
          success: false,
        },
      });
    }

    // Check if game is in betting phase
    if (game.status !== "betting") {
      return res.status(400).json({
        uniqueCode: "CGP00G04",
        message: "Betting is not currently open for this game",
        data: {
          success: false,
        },
      });
    }

    // Validate bet amount
    const betValidation = await validateBetAmount(userId, amount, username);
    if (!betValidation.data.success) {
      return res.status(400).json({
        uniqueCode: betValidation.uniqueCode,
        message: betValidation.message,
        data: betValidation.data,
      });
    }

    // side, multiplier, amount placed, total amount (amount placed * multiplier)
    // const betMap = {}

    // Active bets
    // await redis.hset(`activeBets:${betMap}`, gameId, side);

    // Place bet using base class method
    await game.placeBet(userId, "playerA", amount); // MAIN FUNCTION

    // Broadcast bets to all players
    // const bets = await redis.get(`bets:${this.gameId}`);
    // console.log("Bets placed: ", bets);

    // await this.broadcastBets();

    res.json({
      uniqueCode: "CGP00G05",
      message: "Bet placed successfully",
      data: {
        success: true,
        gameId: game.gameId,
        side,
        amount,
      },
    });
  } catch (error) {
    res.status(error.message.includes("Invalid") ? 400 : 500).json({
      uniqueCode: "CGP00G06",
      message: "Failed to place bet",
      data: { error: error.message },
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
