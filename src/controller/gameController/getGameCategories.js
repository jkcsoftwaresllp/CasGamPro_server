import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { game_categories } from "../../database/schema.js";
import { logger } from "../../logger/logger.js";

export const getGameCatagories = async (req, res) => {
  try {
    const gameList = await db
      .select({
        id: game_categories.id,
        name: game_categories.name,
      })
      .from(game_categories)
      .where(eq(game_categories.blocked, false)); 

    if (gameList.length === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0008",
        message: "No Catagory found",
        data: {},
      });
    }

    res.status(200).json({
      uniqueCode: "CGP0009",
      message: "Catagories fetched successfully",
      data: gameList,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      uniqueCode: "CGP0010",
      message: "Failed to fetch Catagories",
      data: { error: error.message },
    });
  }
};
