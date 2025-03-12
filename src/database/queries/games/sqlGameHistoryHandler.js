import { db } from "../../../config/db.js";

export const history = await db
  .select()
  .from(rounds)
  .where("gameId", "like", `%${gameType}%`)
  .limit(limit);

export  const gameConfig = async (gameId) => {
//    const result = await db.select()
//    .from(rounds)
//    .where("gameId", "like", `%${gameType}%`)
//    .limit(limit);

   // Processing


//    return processedData

}