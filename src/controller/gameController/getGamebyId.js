import { db } from "../../config/db.js";
import { games, categories } from "../../database/schema.js";
import { eq } from "drizzle-orm";

export const getGameById = async (req, res) => {
  try {
    const gameId = req.params.id;

    // Fetch game details by ID and join with the categories table
    const gamesList = await db
      .select({
        id: games.id,
        name: games.name,
        description: games.description,
        category: categories.name,
      })
      .from(games)
      .innerJoin(categories, eq(categories.id, games.category_id)) // Join games with categories
      .where(eq(games.id, gameId)); // Filter by gameId

    // Check if a game was found
    if (!gamesList || gamesList.length === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0005",
        message: "Game not found",
        data: {},
      });
    }

    // Return the game details
    const game = gamesList[0];
    res.status(200).json({
      uniqueCode: "CGP0006",
      message: "",
      data: {
        id: game.id,
        name: game.name,
        description: game.description,
        category: game.category,
      },
    });
  } catch (error) {
    console.error("Error fetching game details:", error);
    res.status(500).json({
      uniqueCode: "CGP0007",
      message: "Failed to fetch game details",
      data: {},
    });
  }
};
