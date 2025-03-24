import { db } from "../../config/db.js";
import { game_categories, games } from "../../database/schema.js";
import { eq } from "drizzle-orm";
export const getGamesByType = async (req, res) => {
  try {
    const { gameType } = req.params;

    //   list of Games under the specific catagory that blocked/non-blocked

    /**
     * 
     * 1. List of Game Catagory (blocking/unblocking)
     * 2. List of Games under the specific catagory (blocking/unblocking)
     * 3. Toggling of blocking/unblocking 
     *      - Game Catagory
     *      - Games under specific Catagory
     */

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
      .from(game_categories)
      .where(eq(game_categories.name, gameType))
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
      .where(eq(games.category_id, category.id));

    

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
      status: game.blocked, 
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
