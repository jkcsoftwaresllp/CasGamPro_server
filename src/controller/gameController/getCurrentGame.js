import gameManager from "../../services/shared/config/manager.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const getCurrentGame = async (req, res) => {
  try {
    const games = gameManager.getActiveGames();
    if (!games || games.length === 0) {
      const noGamesResponse = {
        uniqueCode: "CGP00G03",
        message: "No active games found",
        data: { success: false },
      };
      logToFolderError("Client/controller", "getCurrentGame", noGamesResponse);
      return res.status(404).json(noGamesResponse);
    }

    const currentGame = games[0]; // For now, getting first game

    const successResponse = {
      uniqueCode: "CGP00G01",
      message: "Successfully retrieved current game",
      data: {
        success: true,
        gameId: currentGame.gameId,
        status: currentGame.status,
        jokerCard: currentGame.jokerCard,
        andarCards: currentGame.andarCards,
        baharCards: currentGame.baharCards,
        winner: currentGame.winner,
      },
    };
    logToFolderInfo("Client/controller", "getCurrentGame", successResponse);
    return res.json(successResponse);
  } catch (error) {
    const errorResponse = {
      uniqueCode: "CGP00G02",
      message: "Failed to get current game",
      data: { success: false, error: error.message },
    };
    logToFolderError("Client/controller", "getCurrentGame", errorResponse);
    return res.status(500).json(errorResponse);
  }
};
