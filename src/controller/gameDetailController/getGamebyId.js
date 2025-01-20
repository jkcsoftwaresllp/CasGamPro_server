import { db } from "../../config/db.js";
import { games } from "../../database/schema.js"; // Importing the games schema

export const getGameById = async (req, res) => {
  try {
    const gameId = req.params.id;
    const game = await db
      .select()
      .from(games)
      .where(games.id.eq(gameId))
      .first();

    if (!game) {
      return res.status(404).json({
        uniqueCode: "CGP0017",
        message: "Game not found",
        data: {},
      });
    }

    res.status(200).json({
      uniqueCode: "CGP0018",
      message: "",
      data: {
        id: game.id,
        name: game.name,
        rules: game.rules,
        category: game.category,
      },
    });
  } catch (error) {
    res.status(500).json({
      uniqueCode: "CGP0019",
      message: "Failed to fetch game details",
      data: {},
    });
  }
};
