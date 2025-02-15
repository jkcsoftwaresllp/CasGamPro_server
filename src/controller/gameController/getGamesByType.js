import { db } from "../../config/db.js";
import { categories, games } from "../../database/schema.js";
import { eq } from "drizzle-orm";
export const getGamesByType = async (req, res) => {
  try {
    const { gameType } = req.params;

    if (!gameType) {
      return res.status(400).json({
        uniqueCode: "CGP0077",
        message: "gameType path parameter is required",
        data: { error: "gameType path parameter is required" },
      });
    }

    // Fetch category by name (gameType)
    const categoryResult = await db
      .select()
      .from(categories)
      .where(eq(categories.name, gameType))
      .limit(1);

    if (!categoryResult) {
      return res.status(404).json({
        uniqueCode: "CGP0078",
        message: "No category found for the specified gameType",
        data: { error: "No category found for the specified gameType" },
      });
    }
    const category = categoryResult[0];

    // Fetch games under this category
    const gamesList = await db
      .select()
      .from(games)
      .where(eq(games.categoryId, category.id));

    

    if (gamesList.length === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0079",
        message: "No games found for the specified gameType",
        data: { error: "No games found for the specified gameType" },
      });
    }

    // Format response
    const formattedData = gamesList.map((game, index) => ({
      id: index + 1, 
      betfairid: game.id, 
      name: game.name, 
      description: game.description, 
      thumbnail: game.thumbnail, 
      status: game.blocked ? "inActive" : "active", 
      actions: null, // UI handles actions
    }));

    res.status(200).json({
      uniqueCode: "CGP0080",
      message: "Games fetched successfully",
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      uniqueCode: "CGP0111",
      message: "Error fetching games",
      data: { error: error.message },
    });
  }
};
