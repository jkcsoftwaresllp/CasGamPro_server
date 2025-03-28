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

    /** Step 3: Fetch unique round IDs from ledger */
    const uniqueRoundIds = await db
      .selectDistinct({ roundId: amount_distribution.round_id })
      .from(amount_distribution)
      .where(and(inArray(amount_distribution.user_id, userIds)));

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
      );

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
          pass: 0,
        };
      }

      acc[roundId].betsAmount += betAmount;

      if (entry.roles === "AGENT") {
        acc[roundId].clientPL += keep + pass;
        acc[roundId].agentPL += keep;
        if (userRole === "AGENT") acc[roundId].pass += pass;
      }

      if (entry.roles === "SUPERAGENT") {
        acc[roundId].superAgentPL += keep;
        if (userRole === "SUPERAGENT") acc[roundId].pass += pass;
      }

      if (entry.roles === "ADMIN") {
        acc[roundId].adminPL += keep;
        if (userRole === "ADMIN") acc[roundId].pass += pass;
      }

      return acc;
    }, {});

    let balance = 0;
    const finalResults = uniqueRoundIds
      .map((tx) => {
        const roundId = tx.roundId;
        const record = profitsByRound[roundId];
        balance += record.pass;

        return {
          date: formatDate(record.date),
          dateRaw: new Date(record.date), // Ensure it's a Date object
          entry: roundId,
          betsAmount: record.betsAmount?.toFixed(2),
          clientPL: -1 * record.clientPL?.toFixed(2),
          agentPL: record.agentPL?.toFixed(2),
          superAgentPL: record.superAgentPL?.toFixed(2),
          adminPL: record.adminPL?.toFixed(2),
          pass: balance?.toFixed(2) || 0,
        };
      })
      .sort((a, b) => b.dateRaw - a.dateRaw) // Sort in descending order by date
      .filter((record) => {
        const recordDate = record.dateRaw;
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        return (!start || recordDate >= start) && (!end || recordDate <= end);
      })
      .slice(recordsOffset, recordsOffset + recordsLimit);

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
