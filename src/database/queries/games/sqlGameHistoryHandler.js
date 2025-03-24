import { db } from "../../../config/db.js";
import { game_rounds } from "../../schema.js";

// Export the query as a constant
export const getGameHistory = (gameType, limit) => {
  return db
    .select()
    .from(game_rounds)
    .where("game_id", "like", `%${gameType}%`)
    .limit(limit);
}

export  const gameConfig = async (gameId) => {
//    const result = await db.select()
//    .from(rounds)
//    .where("gameId", "like", `%${gameType}%`)
//    .limit(limit);

   // Processing


//    return processedData

}