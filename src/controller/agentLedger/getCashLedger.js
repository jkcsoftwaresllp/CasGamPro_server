import { db } from "../../config/db.js";
import { cashLedger, users, players, agents } from "../../database/schema.js";
import { eq, sum, desc, sql, asc } from "drizzle-orm";
import { formatDate } from "../../utils/formatDate.js";

export const getCashLedger = async (req, res) => {
  try {
    const agentUserId = req.session.userId;
    const userId = req.params.userId;
    const { startDate, endDate, limit = 30, offset = 0 } = req.query;
    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0166",
        message: "Player ID is required",
        data: {},
      });
    }

    // Verify if the requester is an agent
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, agentUserId))
      .then((res) => res[0]);

    if (!agent) {
      return res.status(403).json({
        uniqueCode: "CGP0167",
        message: "Not authorized as an agent",
        data: {},
      });
    }

    // Check if the player belongs to the agent
    const player = await db
      .select()
      .from(players)
      .where(eq(players.id, userId))
      .then((res) => res[0]);

    if (!player || player.agentId !== agent.id) {
      return res.status(403).json({
        uniqueCode: "CGP0168",
        message: "This player is not under your supervision",
        data: {},
      });
    }

    // Fetch cash transactions for the specific player
    let query = db
      .select({
        date: cashLedger.createdAt,
        via: sql`'Cash'`.as("via"), //TODO
        liya: sql`CASE WHEN ${cashLedger.transactionType} = 'GIVE' THEN ABS(${cashLedger.previousBalance}) ELSE 0 END`,
        diya: sql`CASE WHEN ${cashLedger.transactionType} = 'TAKE' THEN ABS(${cashLedger.previousBalance}) ELSE 0 END`,
        remainingBalance: cashLedger.amount,
      })
      .from(cashLedger)
      .where(eq(cashLedger.playerId, userId))
      .orderBy(cashLedger.createdAt)
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Apply date filters
    if (startDate)
      query = query.where(
        sql`${cashLedger.createdAt} >= ${new Date(startDate)}`
      );
    if (endDate)
      query = query.where(sql`${cashLedger.createdAt} <= ${new Date(endDate)}`);

    const cashTransactions = await query;

    const formattedTransactions = cashTransactions.map((entry) => ({
      date: formatDate(entry.date),
      via: entry.via,
      liya: parseFloat(entry.liya) || 0,
      diya: parseFloat(entry.diya) || 0,
      remainingBalance: entry.remainingBalance,
    }));

    return res.status(200).json({
      uniqueCode: "CGP0169",
      message: "Cash ledger fetched successfully",
      data: { results: formattedTransactions },
    });
  } catch (error) {
    console.error("Error fetching cash ledger:", error);
    return res.status(500).json({
      uniqueCode: "CGP0170",
      message: "Internal server error",
      data: {},
    });
  }
};
