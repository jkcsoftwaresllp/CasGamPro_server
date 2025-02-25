import { db } from "../../config/db.js";
import { games } from "../../database/schema.js";
export const getGames = async (req, res) => {
  try {
    const gameList = await db.select().from(games);

    if (gameList.length === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0008",
        message: "No games found",
        data: {},
      });
    }

    res.status(200).json({
      uniqueCode: "CGP0009",
      message: "Games fetched successfully",
      data: gameList.map((game) => ({
        id: game.id,
        name: game.name,
        thumbnail: game.thumbnail,
        description: game.description,
      })),
    });
  } catch (error) {
    res.status(500).json({
      uniqueCode: "CGP0010",
      message: "Failed to fetch games",
      data: { error: error.message },
    });
  }
};
