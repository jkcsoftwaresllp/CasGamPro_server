import gameManager from '../services/shared/configs/manager.js';
import redis from '../config/redis.js';

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
                    winner: currentGame.winner
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get current game'
            });
        }
    },

    // Place bet
    placeBet: async (req, res) => {
        try {
            const { side, amount } = req.body;
            const userId = req.session.userId; // Assuming you have authentication middleware

            // Validate input
            if (!['Andar', 'Bahar'].includes(side)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid side selected'
                });
            }

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid bet amount'
                });
            }

            const currentGame = gameManager.getActiveGames()[0];

            // Place bet
            await currentGame.placeBet(userId, side, amount);

            res.json({
                success: true,
                message: 'Bet placed successfully',
                data: { gameId: currentGame.gameId, side, amount }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to place bet'
            });
        }
    },

    // Get game history
    getGameHistory: async (req, res) => {
        try {
            const history = await redis.lrange('game_history', 0, 9); // Get last 10 games
            const parsedHistory = history.map(game => JSON.parse(game));

            res.json({
                success: true,
                data: parsedHistory
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get game history'
            });
        }
    }
};