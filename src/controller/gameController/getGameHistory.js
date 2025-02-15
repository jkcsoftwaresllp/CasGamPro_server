import { gameHistoryHandler } from "./gameHistoryHandler.js";

export const getGameHistory = async (req, res) => {
  try {
    const { gameType, limit = 15 } = req.query;

    const parsedHistory = await gameHistoryHandler(gameType, limit);

    if (parsedHistory === null) throw Error();

    res.json({
      uniqueCode: "CGP00G10",
      message: "Game history retrieved successfully",
      data: [...parsedHistory],
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
