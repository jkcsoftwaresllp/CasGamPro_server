import { db } from "../config/db.js";
import { favoriteGames } from "../database/schema.js"; // Import favorite games schema

export const favouriteGameController = {
  getFavoriteGames: async (req, res) => {
    const userId = req.user.id; // Get the user ID from the request

    try {
      // Query the favorite_games table to get the list of games for the user
      const games = await db
        .select()
        .from(favoriteGames)
        .where(favoriteGames.userId.eq(userId));

      if (games.length === 0) {
        return res.status(404).json({
          uniqueCode: "CGP0010",
          message: "No favorite games found for this user",
          data: { favorites: [] },
        });
      }

      // Send the list of favorite games
      res.status(200).json({
        uniqueCode: "CGP0010",
        message: "",
        data: { favorites: games.map((game) => game.name) }, // Extract game names
      });
    } catch (error) {
      res.status(500).json({
        uniqueCode: "CGP0017",
        message: "Error fetching favorite games",
        data: {
          error: error.message,
        },
      });
    }
  },
};
