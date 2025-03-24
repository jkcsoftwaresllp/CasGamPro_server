// gameConfigQuery.js
import { eq } from "drizzle-orm";
import { db } from "../../../config/db.js";
import { games, game_bet_sides } from "../../../database/schema.js";

export const getGameConfig = async (gameType) => {
  const [result] = await db
    .select()
    .from(games)
    .where(eq(games.gameType, gameType));

  if (!result) {
    throw new Error(`Game with gameType ${gameType} not found`);
  }

  // Fetch bet sides and multipliers from the game_bet_sides table
  const betSidesData = await db
    .select()
    .from(game_bet_sides)
    .where(eq(game_bet_sides.game_id, result.id)); // Assuming `result.id` is the game_id

  // Format the betSides and multipliers into a structured object
  const betSides = betSidesData.map((side) => side.bet_side);
  const multipliers = betSidesData.reduce((acc, side) => {
    acc[side.bet_side] = side.multiplier;
    return acc;
  }, {});

  return {
    gameId: result.id,
    gameType: result.gameType,
    betSides,
    multipliers,
    bettingDuration: result.betting_duration,
    cardDealInterval: result.card_deal_interval,
  };
};
