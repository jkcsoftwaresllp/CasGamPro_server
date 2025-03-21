import { db } from "../../config/db.js";
import {
  games,
  game_categories,
  game_favourites,
} from "../../database/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { boolean } from "drizzle-orm/mysql-core";

export const getGamesByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const userId = req.session.userId;

    console.log("DDD",{categoryId, userId})

    // Validate categoryId
    if (isNaN(categoryId)) {
      return res.status(400).json({
        uniqueCode: "CGP0011",
        message: "Invalid categoryId: Must be a number.",
        data: { error: error.message },
      });
    }

    const gamesList = await db
      .select({
        id: games.id,
        name: games.name,
        category: game_categories.name,
        gameId: games.id,
        gameType: games.gameType,
        isFavourite:
          sql`CASE WHEN ${game_favourites.user_id} IS NOT NULL THEN TRUE ELSE FALSE END`.as(
            "isFavourite"
          ),
      })
      .from(games)
      .innerJoin(game_categories, eq(game_categories.id, games.category_id))
      .leftJoin(
        game_favourites,
        and(
          eq(game_favourites.game_id, games.id),
          eq(game_favourites.user_id, userId)
        )
      )
      .where(
        and(
          eq(game_categories.id, categoryId), // Filter by category
          eq(games.blocked, "ACTIVE") // Exclude blocked games
        )
      );

    if (gamesList.length === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0012",
        message: "No games found for this category.",
        data: {},
      });
    }

    return res
      .status(200)
      .json({ uniqueCode: "CGP0013", message: "", data: gamesList });
  } catch (error) {
    logger.error("Error fetching games by category ID:", error);
    return res.status(500).json({
      uniqueCode: "CGP0014",
      message: "",
      data: { error: error.message },
    });
  }
};
