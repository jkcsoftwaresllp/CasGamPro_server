import { gameHistoryHandler } from "./gameHistoryHandler.js";

export const getGameHistory = async (req, res) => {
    return ;

  try {
    const { gameType, limit = 15 } = req.query;
    if (!gameType) {
      console.log("Game history frontend error")
      res.json({
        uniqueCode: "CGP00G10",
        message: "Game history retrieved successfully",
        data: {},
      });
      return ;
    }
    console.log(`received req: ${gameType}`);
    const parsedHistory = await gameHistoryHandler(gameType, limit);

    if (!parsedHistory) throw Error("Failed to get game history");

    res.json({
      uniqueCode: "CGP00G10",
      message: "Game history retrieved successfully",
      data: parsedHistory,
    });
  } catch (error) {
    console.log("Game History Error", error);
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
