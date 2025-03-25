import { eq } from "drizzle-orm";
import { db } from "../../../config/db.js";
import {
  game_bets,
  game_bet_sides,
  user_limits_commissions,
  users,
  ledger,
} from "../../schema.js";

export async function fetchBetsForRound(roundId) {
  return await db
    .select({
      betId: game_bets.id,
      userId: game_bets.user_id,
      roundId: game_bets.round_id,
      betAmount: game_bets.bet_amount,
      betSide: game_bets.bet_side,
      multiplier: game_bet_sides.multiplier, // Fetching multiplier
    })
    .leftJoin(game_bet_sides, eq(game_bets.bet_side, game_bet_sides.bet_side))
    .from(game_bets)
    .where(eq(game_bets.round_id, roundId));
}

export async function insertIntoLedger(payload) {
  await db.insert(ledger).values(payload).execute();
}

export async function getCasinoCut(childId) {
  //fetch parent_id
  const { parentId } = await db
    .select({ parentId: users.parent_id })
    .from(users);

  console.info(`Player #${childId}'s parent Id: ${parentId}`);

  // return corresponding share and commision
  return await db
    .select({
      share: user_limits_commissions.max_share,
      commision: user_limits_commissions.max_casino_commission,
    })
    .from(user_limits_commissions)
    .where(eq(user_limits_commissions.user_id, parentId));
}
