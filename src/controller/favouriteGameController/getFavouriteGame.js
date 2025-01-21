import { db } from "../../config/db.js";
import { eq, and } from "drizzle-orm";
import { favoriteGames } from "../../database/schema.js";

export const getFavouriteGame = async (req, res) => {
  const { gameId, name, totalPlayTime, gameImg } = req.body;
  const userId = req.user?.id;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({
      uniqueCode: "CGP0014",
      message: "Invalid user ID.",
      data: {},
    });
  }

  try {
    // Check if the game is already in the user's favorite list
    const existingGame = await db
      .select()
      .from(favoriteGames)
      .where(eq(favoriteGames.userId, userId))
      .and(eq(favoriteGames.gameId, gameId));

    if (existingGame.length > 0) {
      // Game already in favorites, remove it
      await db
        .delete()
        .from(favoriteGames)
        .where(eq(favoriteGames.userId, userId))
        .and(eq(favoriteGames.gameId, gameId));

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
