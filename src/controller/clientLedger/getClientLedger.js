import { db } from "../../config/db.js";
import { ledger, agentTransactions, players } from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { formatDate } from "../../utils/formatDate.js";
import { filterUtils } from "../../utils/filterUtils.js";
import { getGameName } from "../../utils/getGameName.js";

// Utility function to extract gameTypeId
const getPrefixBeforeUnderscore = (roundId) => {
  return roundId ? roundId.split("_")[0] : null;
};

// Get client ledger entries
export const getClientLedger = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { limit = 30, offset = 0, startDate, endDate } = req.query;

    // Apply filters
    const filters = filterUtils({ startDate, endDate, userId });

    // Fetch game ledger entries
    const gameEntries = await db
      .select({
        date: ledger.date,
        entry: ledger.roundId, // Fetching roundId to determine game name
        debit: ledger.debit,
        credit: ledger.credit,
      })
      .from(ledger)
      .where(eq(ledger.userId, userId))
      .orderBy(desc(ledger.date))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Fetch agent transactions (cash receive/pay)
    const cashTransactions = await db
      .select({
        date: agentTransactions.createdAt,
        entry: agentTransactions.description,
        debit: sql`CASE WHEN ${agentTransactions.transactionType} = 'GIVE' THEN ${agentTransactions.amount} ELSE 0 END`,
        credit: sql`CASE WHEN ${agentTransactions.transactionType} = 'TAKE' THEN ${agentTransactions.amount} ELSE 0 END`,
      })
      .from(agentTransactions)
      .innerJoin(players, eq(agentTransactions.playerId, players.id))
      .where(eq(players.userId, userId))
      .orderBy(desc(agentTransactions.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Merge both game entries and cash transactions
    const allEntries = [...gameEntries, ...cashTransactions];

    // Sort transactions by date (ascending) to compute balance correctly
    allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let balance = 0;
    const formattedEntries = allEntries.map((entry) => {
      let entryName;

      if ("roundId" in entry) {
        const gameTypeId = getPrefixBeforeUnderscore(entry.roundId);
        entryName = getGameName(gameTypeId);
      } else {
        entryName = entry.entry;
      }

      balance += entry.credit - entry.debit; // Update balance sequentially

      return {
        date: formatDate(entry.date),
        entry: entryName,
        debit: entry.debit || 0,
        credit: entry.credit || 0,
        balance: balance,
      };
    });

    return res.status(200).json({
      uniqueCode: "CGP0085",
      message: "Ledger entries fetched successfully",
      data: { results: formattedEntries },
    });
  } catch (error) {
    logger.error("Error fetching ledger entries:", error);
    return res.status(500).json({
      uniqueCode: "CGP0086",
      message: "Internal server error",
      data: {},
    });
  }
};
