import { gameHistoryHandler } from "../../services/shared/config/socket/gameHistoryHandler.js";

export const getGameHistory = async (req, res) => {
  try {
    const { gameType, limit = 15 } = req.query;

    // console.log("Game History", gameType, limit);

    const parsedHistory = await gameHistoryHandler(gameType, limit);
    // console.log("Parsed History", parsedHistory);

    if (!parsedHistory) throw Error("Failed to get game history");

    res.json({
      uniqueCode: "CGP00G10",
      message: "Game history retrieved successfully",
      data: [...parsedHistory],
    });
  } catch (error) {
    console.log("Game Histroy Error", error);
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
