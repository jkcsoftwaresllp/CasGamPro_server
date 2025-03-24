import { db } from "../config/db.js";
import { ledger, users, game_bets, game_rounds, games, user_limits_commissions } from "../database/schema.js";
import { eq, inArray } from "drizzle-orm";
import { getBetMultiplier } from "../services/shared/helper/getBetMultiplier.js";
import { formatDate } from "../utils/formatDate.js";
import { filterDateUtils } from "../utils/filterUtils.js";

export const getParentTransactions = async (req, res) => {
  try {
    const { limit = 30, offset = 0, startDate, endDate } = req.query;
    const userId = req.session.userId;
    
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    // Fetch user info
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ uniqueCode: "CGP0081", message: "User not found", data: {} });
    }

    // Get all descendants (players under the hierarchy)
    const getDescendants = async (parentId) => {
      const children = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.parent_id, parentId));
      let allDescendants = children.map((child) => child.id);
      for (const child of children) {
        allDescendants = allDescendants.concat(await getDescendants(child.id));
      }
      return allDescendants;
    };

    const playerIds = await getDescendants(userId);
    if (playerIds.length === 0) {
      return res.json({ uniqueCode: "CGP0085", message: "No transactions found", data: { results: [] } });
    }

    let ledgerResult = await db
      .selectDistinct({ roundId: ledger.round_id, gameType: games.gameType, date: ledger.created_at })
      .from(ledger)
      .innerJoin(users, eq(ledger.user_id, users.id))
      .innerJoin(game_rounds, eq(ledger.round_id, game_rounds.id))
      .innerJoin(games, eq(game_rounds.game_id, games.id))
      .where(inArray(users.id, playerIds));

    ledgerResult = filterDateUtils({ data: ledgerResult, startDate, endDate });
    ledgerResult.sort((a, b) => new Date(a.date) - new Date(b.date));

    let balance = 0;
    let results = [];

    for (let round of ledgerResult) {
      let bets = await db
        .select({ betAmount: game_bets.bet_amount, win: game_bets.win_amount, betSide: game_bets.bet_side })
        .from(game_bets)
        .where(eq(game_bets.round_id, round.roundId));

      const totalBetAmount = bets.reduce((sum, entry) => sum + entry.betAmount, 0);
      const winningBets = bets.reduce((sum, entry) => (entry.win ? sum + entry.betAmount : sum), 0);
      const lossingBets = winningBets - totalBetAmount;
      
      const winningAmount = await Promise.all(
        bets.map(async (entry) => entry.win ? entry.betAmount * await getBetMultiplier(round.gameType, entry.betSide) : 0)
      ).then((values) => values.reduce((sum, val) => sum + val, 0));

      const childProfit = winningAmount - winningBets;
      const overallChildPL = childProfit + lossingBets;
      const overAllHierarchy = -overallChildPL;

      const [commission] = await db
        .select({ maxShare: user_limits_commissions.max_share, maxCasinoCommission: user_limits_commissions.max_casino_commission })
        .from(user_limits_commissions)
        .where(eq(user_limits_commissions.user_id, userId));

      const parentShare = (overAllHierarchy * commission.maxShare) / 100;
      const parentCommission = (totalBetAmount * commission.maxCasinoCommission) / 100;
      const parentPL = parentShare + parentCommission;
      const superAgentPL = overAllHierarchy - parentPL;
      balance += parentPL;

      results.push({
        date: formatDate(round.date),
        entry: round.roundId,
        betsAmount: totalBetAmount,
        clientPL: overallChildPL,
        agentShare: parentShare,
        superComm: parentCommission,
        agentPL: parentPL,
        superAgentPL: superAgentPL,
        balance: balance,
      });
    }

    results = results.reverse().slice(recordsOffset, recordsOffset + recordsLimit);

    return res.json({ uniqueCode: "CGP0085", message: "Transactions fetched successfully", data: { results } });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ uniqueCode: "CGP0086", message: "Internal server error", data: {} });
  }
};
