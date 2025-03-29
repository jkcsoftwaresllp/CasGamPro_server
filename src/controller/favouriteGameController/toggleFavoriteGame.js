import { db } from "../../config/db.js";
import { game_favourites } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";
import { GAME_TYPES } from "../../services/shared/config/types.js";

export const toggleFavoriteGame = async (req, res) => {
  try {
    const { gameId: game_id } = req.body;
    const userId = req.session.userId;

    // Validate input
    if (!userId) {
      return res.status(400).json({
        message: "userId and gameId are required",
        uniqueCode: "CGP0101",
        data: {},
      });
    }

    // Check if the favorite already exists
    const existingFavorite = await db
      .select()
      .from(game_favourites)
      .where(
        and(
          eq(game_favourites.user_id, userId),
          eq(game_favourites.game_id, game_id)
        )
      );

    if (existingFavorite.length > 0) {
      // Remove from favorites if already exists
      await db
        .delete(game_favourites)
        .where(
          and(
            eq(game_favourites.user_id, userId),
            eq(game_favourites.game_id, game_id)
          )
        );

      return res.status(200).json({
        message: "Game removed from favorites",
        uniqueCode: "CGP0103",
        data: {},
      });
    } else {
      // Add to favorites if not present
      await db.insert(game_favourites).values({ user_id: userId, game_id });

      return res.status(201).json({
        message: "Game added to favorites",
        uniqueCode: "CGP0104",
        data: {},
      });
    }
  } catch (error) {
    console.error("Error toggling favorite game:", error);
    return res.status(500).json({
      message: "Internal server error",
      uniqueCode: "CGP0105",
      data: {},
    });
  }
};
