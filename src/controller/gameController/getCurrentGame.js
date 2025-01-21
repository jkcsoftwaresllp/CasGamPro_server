import gameManager from "../../services/shared/config/manager.js";
import redis from "../../config/redis.js";

export const getCurrentGame = async (req, res) => {
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
};
