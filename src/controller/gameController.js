import gameManager from "../services/shared/config/manager.js";
import redis from "../config/redis.js";

export const gameController = {
	// Get current game state
	getCurrentGame: async (req, res) => {
		try {
			const games = gameManager.getActiveGames();
			const currentGame = games[0]; // For now, getting first game

			res.json({
				success: true,
				data: {
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
				success: false,
				error: "Failed to get current game",
			});
		}
	},

	placeBet: async (req, res) => {
		try {
			const { side, amount } = req.body;
			const userId = req.session.userId;
			const username = req.session.username;
			const currentGame = gameManager.getActiveGames()[0];

			// Validate bet amount
			await currentGame.validateBetAmount(userId, amount, username);

			// Place bet using base class method
			await currentGame.placeBet(userId, side, amount);

			res.json({
				success: true,
				message: "Bet placed successfully",
				data: {
					gameId: currentGame.gameId,
					side,
					amount,
				},
			});
		} catch (error) {
			res.status(error.message.includes("Invalid") ? 400 : 500).json({
				success: false,
				error: error.message || "Failed to place bet",
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
					success: false,
					error: "Game not found",
				});
			}

			res.json({
				success: true,
				data: {
					options: game.getValidBetOptions(),
				},
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				error: "Failed to get bet options",
			});
		}
	},

	// Get game history
	getGameHistory: async (req, res) => {
		try {
			const history = await redis.lrange("game_history", 0, 9); // Get last 10 games
			const parsedHistory = history.map((game) => JSON.parse(game));

			res.json({
				success: true,
				data: parsedHistory,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				error: "Failed to get game history",
			});
		}
	},
};
