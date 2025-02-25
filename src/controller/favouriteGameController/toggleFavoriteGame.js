import { db } from "../../config/db.js";
import { favoriteGames } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";
import { GAME_TYPES } from "../../services/shared/config/types.js";

export const toggleFavoriteGame = async (req, res) => {
  try {
    const { gameId: gameType } = req.body;
    const userId = req.session.userId;

    // Validate input
    if (!userId || !gameType) {
      return res.status(400).json({
        message: "userId and gameId are required",
        uniqueCode: "CGP0101",
        data: {},
      });
    }

    // Validate game type
    if (!Object.values(GAME_TYPES).includes(gameType)) {
      return res.status(400).json({
        message: "Invalid game type",
        uniqueCode: "CGP0102",
        data: {},
      });
    }

    // Check if the favorite already exists
    const existingFavorite = await db
      .select()
      .from(favoriteGames)
      .where(
        and(
          eq(favoriteGames.userId, userId),
          eq(favoriteGames.gameType, gameType)
        )
      );

    if (existingFavorite.length > 0) {
      // Remove from favorites if already exists
      await db
        .delete(favoriteGames)
        .where(
          and(
            eq(favoriteGames.userId, userId),
            eq(favoriteGames.gameType, gameType)
          )
        );

      return res.status(200).json({
        message: "Game removed from favorites",
        uniqueCode: "CGP0103",
        data: {},
      });
    } else {
      // Add to favorites if not present
      await db.insert(favoriteGames).values({ userId, gameType });

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
