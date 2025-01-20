import { db } from "../../config/db.js"; // Import db instance
import { eq } from "drizzle-orm";
import { favoriteGames } from "../../database/schema.js"; // Import favorite games schema

export const getFavouriteGame = async (req, res) => {
  const { gameId, name, totalPlayTime, gameImg } = req.body; // Get game details from the request body
  const userId = req.user?.id; // Get the user ID from the request

  try {
    // Check if the game is already in the user's favorite list
    const existingGame = await db
      .select()
      .from(favoriteGames)
      .where(favoriteGames.userId.eq(userId))
      .and(favoriteGames.gameId.eq(gameId));

    if (existingGame.length > 0) {
      // Game already in favorites, remove it
      await db
        .delete()
        .from(favoriteGames)
        .where(favoriteGames.userId.eq(userId))
        .and(favoriteGames.gameId.eq(gameId));

      return res.status(200).json({
        uniqueCode: "CGP0022",
        message: "Game removed from favorites.",
        data: {},
      });
    }

    // Game not in favorites, add it
    await db.insert(favoriteGames).values({
      userId: userId,
      gameId: gameId,
      name: name,
      totalPlayTime: totalPlayTime,
      gameImg: gameImg,
    });

    res.status(201).json({
      uniqueCode: "CGP0020",
      message: "Game added to favorites successfully.",
      data: {
        game: { name, totalPlayTime, gameImg },
      },
    });
  } catch (error) {
    res.status(500).json({
      uniqueCode: "CGP0013",
      message: "Error toggling favorite game",
      data: {
        error: error.message,
      },
    });
  }
};
