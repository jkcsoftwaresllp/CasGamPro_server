import { db } from "../config/db.js"; // Assuming db is your database connection
import { games } from "../database/schema.js"; // Importing the games schema

const gameDetailController = {
  // Fetch the list of available games
  getGames: async (req, res) => {
    try {
      const gameList = await db.select().from(games);

      if (gameList.length === 0) {
        return res.status(404).json({
          uniqueCode: "CGP0014",
          message: "No games found",
          data: {},
        });
      }

      res.status(200).json({
        uniqueCode: "CGP0015",
        message: "",
        data: gameList.map((game) => ({
          id: game.id,
          name: game.name,
          thumbnail: game.thumbnail,
          description: game.description,
        })),
      });
    } catch (error) {
      res.status(500).json({
        uniqueCode: "CGP0016",
        message: "Failed to fetch games",
        data: {},
      });
    }
  },

  // Fetch detailed information of a specific game
  getGameById: async (req, res) => {
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
  },
};

export default gameDetailController;
