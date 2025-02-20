// import { db } from "../../config/db.js";
// import { gameConfigs, games } from "../../database/schema.js";
// import { logger } from "../../logger/logger.js";
// import { eq } from "drizzle-orm";

// export const getGameConfigs = async (req, res) => {
//   try {
//     const gameConfigRecords = await db
//       .select({
//         id: gameConfigs.id,
//         gameType: games.gameType,
//         name: games.name,
//         betSides: gameConfigs.betSides,
//         multipliers: gameConfigs.multipliers,
//         bettingDuration: gameConfigs.bettingDuration,
//         cardDealInterval: gameConfigs.cardDealInterval,
//       })
//       .from(gameConfigs)
//       .innerJoin(games, eq(gameConfigs.gameId, games.id));

//     // Ensure proper JSON parsing with error handling
//     const formattedConfigs = gameConfigRecords.map((config) => {
//       let betSides, multipliers;

//       try {
//         betSides =
//           typeof config.betSides === "string"
//             ? JSON.parse(config.betSides)
//             : config.betSides;
//       } catch (error) {
//         logger.error(`Error parsing betSides for gameId ${config.id}:`, error);
//         betSides = []; // Default empty array in case of parsing failure
//       }

//       try {
//         multipliers =
//           typeof config.multipliers === "string"
//             ? JSON.parse(config.multipliers)
//             : config.multipliers;
//       } catch (error) {
//         logger.error(
//           `Error parsing multipliers for gameId ${config.id}:`,
//           error
//         );
//         multipliers = {}; // Default empty object in case of parsing failure
//       }

//       return {
//         ...config,
//         betSides,
//         multipliers,
//       };
//     });

//     res.json(formattedConfigs);
//   } catch (error) {
//     logger.error("Error fetching game configurations:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };
