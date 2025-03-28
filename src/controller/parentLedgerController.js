import { tr } from "date-fns/locale";
import { db } from "../config/db.js";
import { amount_distribution, ledger, users } from "../database/schema.js";
import { eq, inArray, and, gte, lte, sql } from "drizzle-orm";
import { date } from "drizzle-orm/pg-core";
import { formatDate } from "../utils/formatDate.js";

export const getParentTransactions = async (req, res) => {
  try {
    const { limit = 30, offset = 0, startDate, endDate } = req.query;
    const userId = req.session.userId;
    const userRole = req.session.userRole;

    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    /** Step 1: Fetch child user IDs based on role */
    let userIds = [userId];

    if (userRole === "SUPERAGENT") {
      const agents = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.parent_id, userId));
      userIds = [userId, ...agents.map((a) => a.id)];
    } else if (userRole === "ADMIN") {
      const superAgents = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.parent_id, userId));

      const agentIds = await db
        .select({ id: users.id })
        .from(users)
        .where(
          inArray(
            users.parent_id,
            superAgents.map((sa) => sa.id)
          )
        );

      userIds = [
        userId,
        ...superAgents.map((sa) => sa.id),
        ...agentIds.map((a) => a.id),
      ];
    }

    /** Step 2: Build date filters */
    const dateFilters = [];
    if (startDate)
      dateFilters.push(gte(ledger.created_at, new Date(startDate)));
    if (endDate) dateFilters.push(lte(ledger.created_at, new Date(endDate)));

    /** Step 3: Fetch unique round IDs from ledger */
    const uniqueRoundIds = await db
      .selectDistinct({ roundId: amount_distribution.round_id })
      .from(amount_distribution)
      .where(
        and(inArray(amount_distribution.user_id, userIds), ...dateFilters)
      );

    const roundIds = uniqueRoundIds.map((entry) => entry.roundId);

    if (roundIds.length === 0) {
      return res.json({
        uniqueCode: "CGP0085",
        message: "No transactions found",
        data: { results: [] },
      });
    }

    /** Step 4: Fetch transactions using unique round IDs */
    const transactions = await db
      .select()
      .from(amount_distribution)
      .where(
        and(
          inArray(amount_distribution.user_id, userIds),
          inArray(amount_distribution.round_id, roundIds)
        )
      )
      .limit(recordsLimit)
      .offset(recordsOffset);

    const profitsByRound = transactions.reduce((acc, entry) => {
      const roundId = entry.round_id;
      const keep = parseFloat(entry.keep) || 0;
      const pass = parseFloat(entry.pass) || 0;
      const betAmount = parseFloat(entry.bet_amount) || 0;

      if (!acc[roundId]) {
        acc[roundId] = {
          date: entry.created_at,
          betsAmount: 0,
          clientPL: 0,
          agentPL: 0,
          superAgentPL: 0,
          adminPL: 0,
        };
      }

      acc[roundId].betsAmount += betAmount;

      if (entry.roles === "AGENT") {
        acc[roundId].clientPL += keep + pass;
        acc[roundId].agentPL += keep;
      }

      if (entry.roles === "SUPERAGENT") {
        acc[roundId].superAgentPL += keep;
      }

      if (entry.roles === "ADMIN") {
        acc[roundId].adminPL += keep;
      }

      return acc;
    }, {});

    /** Step 5: Fetch balance for "COMMISSION" transactions */
    const balances = await db
      .select({ roundId: ledger.round_id, balance: ledger.new_coins_balance })
      .from(ledger)
      .where(
        and(
          inArray(ledger.round_id, roundIds),
          eq(ledger.transaction_type, "COMMISSION"),
          eq(ledger.user_id, userId)
        )
      );

    /** Step 6: Merge balances */
    const balanceMap = Object.fromEntries(
      balances.map(({ roundId, balance }) => [roundId, balance])
    );

    const finalResults = uniqueRoundIds
      .map((tx) => {
        const roundId = tx.roundId;
        const record = profitsByRound[roundId];
        return {
          date: formatDate(record.date),
          dateRaw: record.date,
          entry: roundId,
          betsAmount: record.betsAmount?.toFixed(2),
          clientPL: -1 * record.clientPL?.toFixed(2),
          agentPL: record.agentPL?.toFixed(2),
          superAgentPL: record.superAgentPL?.toFixed(2),
          adminPL: record.adminPL?.toFixed(2),
          balance: balanceMap[roundId] || 0,
        };
      })
      .sort((a, b) => b.dateRaw - a.dateRaw);

    return res.json({
      uniqueCode: "CGP0085",
      message: "Transactions fetched successfully",
      data: { results: finalResults },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({
      uniqueCode: "CGP0086",
      message: "Internal server error",
      data: {},
    });
  }
};
