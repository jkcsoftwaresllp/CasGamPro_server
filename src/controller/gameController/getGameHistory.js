import gameManager from "../../services/shared/config/manager.js";
import redis from "../../config/redis.js";
export const getGameHistory = async (req, res) => {
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
};
