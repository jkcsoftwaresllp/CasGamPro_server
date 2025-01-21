// /src/controllers/gameController.js
import { db } from "../../config/db.js"; // Importing the database connection
import { games, categories } from "../../database/schema.js"; // Importing the games and categories schema
import { eq } from "drizzle-orm";

export const getGameById = async (req, res) => {
  try {
    const gameId = req.params.id;

    // Fetch game details by ID and join with the categories table
    const gamesList = await db
      .select({
        id: games.id,
        name: games.name,
        description: games.description, // Renaming description to rule in the response
        category: categories.name, // Fetch the category name
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
    const game = gamesList[0]; // Access the first game
    res.status(200).json({
      uniqueCode: "CGP0006",
      message: "",
      data: {
        id: game.id,
        name: game.name,
        description: game.description,
        category: game.category, // The category name
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
