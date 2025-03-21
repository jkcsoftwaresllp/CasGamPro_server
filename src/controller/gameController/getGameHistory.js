import { logger } from "../../logger/logger.js";
import { gameHistoryHandler } from "./gameHistoryHandler.js";

export const getGameHistory = async (req, res) => {
  try {
    const { gameType, limit = 15 } = req.query;
    if (!gameType) {
      logger.info("Game history frontend error");
      res.json({
        uniqueCode: "CGP00G11",
        message: "Game history frontend error",
        data: {},
      });
      return;
    }
    const parsedHistory = await gameHistoryHandler(gameType, limit);

    if (!parsedHistory) throw Error("Failed to get game history");

    res.json({
      uniqueCode: "CGP00G10",
      message: "Game history retrieved successfully",
      data: parsedHistory,
    });
  } catch (error) {
    logger.error("Game History Error", error);
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
