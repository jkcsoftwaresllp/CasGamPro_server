import { db } from "../../config/db.js";
import { game_favourites, games } from "../../database/schema.js";
import { eq } from "drizzle-orm";

export const getFavouriteGame = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Validate input
    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
        uniqueCode: "CGP0001",
        data: {},
      });
    }

    // Fetch favorite games for the user
    const favorites = await db
      .select({
        gameType: games.gameType,
        name: games.name,
        description: games.description,
        thumbnail: games.thumbnail,
      })
      .from(game_favourites)
      .innerJoin(games, eq(game_favourites.game_id, games.id))
      .where(eq(game_favourites.user_id, userId));

    return res.status(200).json({
      message: "Favourite games fetch Successfully",
      uniqueCode: "CGP0002",
      data: favorites,
    });
  } catch (error) {
    console.error("Error fetching favorite games:", error);
    return res
      .status(500)
      .json({
        message: "Internal server error",
        uniqueCode: "CGP0003",
        data: {},
      });
  }
};
