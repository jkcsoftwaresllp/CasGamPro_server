import gameManager from "../services/shared/config/manager.js";
import redis from "../config/redis.js";

export const gameController = {
  // Get current game state
  getCurrentGame: async (req, res) => {
    try {
      const games = gameManager.getActiveGames();
      const currentGame = games[0]; // For now, getting first game

      res.json({
        uniqueCode: "CGP00G01",
        message: "",
        data: {
          success: true,
          gameId: currentGame.gameId,
          status: currentGame.status,
          jokerCard: currentGame.jokerCard,
          andarCards: currentGame.andarCards,
          baharCards: currentGame.baharCards,
          winner: currentGame.winner,
        },
      });
    } catch (error) {
      res.status(500).json({
        uniqueCode: "CGP00G02",
        message: "Failed to get current game",
        data: { success: false },
      });
    }
  },

  placeBet: async (req, res) => {
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
      await game.validateBetAmount(userId, amount, username);

      // Place bet using base class method
      await game.placeBet(userId, side, amount);

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
        data: { success: false, error: error.message || "Failed to place bet" },
      });
    }
  },

  // Add method to get valid bet options for a game
  getValidBetOptions: async (req, res) => {
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
  },

  // Get game history
  getGameHistory: async (req, res) => {
    try {
      const history = await redis.lrange("game_history", 0, 9); // Get last 10 games
      const parsedHistory = history.map((game) => JSON.parse(game));

      res.json({
        uniqueCode: "CGP00G10",
        message: "Game history retrieved successfully",
        data: {
          success: true,
          parsedHistory,
        },
      });
    } catch (error) {
      res.status(500).json({
        uniqueCode: "CGP00G11",
        message: "Failed to get game history",
        data: {
          success: false,
          error: "Failed to get game history",
        },
      });
    }
  },
};
