import { db } from "../../config/db.js";
import {
  ledger,
  players,
  agents,
  rounds,
  users,
  coinsLedger,
} from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { getGameName } from "../../utils/getGameName.js";
import { convertToDelhiISO, formatDate } from "../../utils/formatDate.js";
import { filterUtils } from "../../utils/filterUtils.js";

const getPrefixBeforeUnderscore = (roundId) => {
  return roundId ? roundId.split("_")[0] : "";
};

export const getUserStatementForAgent = async (req, res) => {
  try {
    const agentUserId = req.session.userId;
    const userId = req.params.userId;
    const { limit = 30, offset = 0, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0175",
        message: "User ID is required",
        data: {},
      });
    }

    // Verify if the logged-in user is an agent
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, agentUserId))
      .then((res) => res[0]);

    if (!agent) {
      return res.status(403).json({
        uniqueCode: "CGP0176",
        message: "Not authorized as an agent",
        data: {},
      });
    }

    // Apply filters
    const filters = filterUtils({ startDate, endDate, userId });

    // Fetch ledger entries for the specific user
    const ledgerStatements = await db
      .select({
        date: ledger.date,
        roundId: ledger.roundId,
        credit: ledger.credit,
        debit: ledger.debit,
        result: ledger.result,
      })
      .from(ledger)
      .leftJoin(rounds, eq(ledger.roundId, rounds.roundId))
      .leftJoin(users, eq(ledger.userId, users.id))
      .where(eq(ledger.userId, userId))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Fetch from `coinsLedger` for the specific user
    const coinsLedgerStatements = await db
      .select({
        date: coinsLedger.createdAt,
        type: coinsLedger.type,
        credit:
          sql`CASE WHEN ${coinsLedger.type} = 'DEPOSIT' THEN ${coinsLedger.amount} ELSE 0 END`.as(
            "credit"
          ),
        debit:
          sql`CASE WHEN ${coinsLedger.type} = 'WITHDRAWAL' THEN ${coinsLedger.amount} ELSE 0 END`.as(
            "debit"
          ),
      })
      .from(coinsLedger)
      .leftJoin(users, eq(users.id, coinsLedger.userId))
      .innerJoin(players, eq(coinsLedger.userId, players.userId))

      .where(eq(players.userId, userId));

    // Merge both game entries and cash transactions
    let allEntries = [...ledgerStatements, ...coinsLedgerStatements];

    allEntries = allEntries.map((entry) => {
      return {
        ...entry,
        date:
          entry.result === "WIN" ? entry.date : convertToDelhiISO(entry.date),
      };
    });

    // Sort transactions by date (descending)
    allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));


    let runningBalance = 0;
    const modifiedClientStatements = await Promise.all(
      allEntries.map(async (entry) => {
        let description = "";

        if (entry.roundId) {
          // Entry is from `ledger`
          const gameTypeId = getPrefixBeforeUnderscore(entry.roundId);
          // const gameName = await getGameName(gameTypeId);
          const gameName = "Game Name will come here"; // TODO: Add a game Name
          let winOrLoss =
            entry.result === "WIN"
              ? "Win"
              : entry.result === "LOSS"
              ? "Loss"
              : "";
          description = `${winOrLoss} ${gameName}`;
        } else if (entry.type) {
          description = entry.type;
        } else {
          description = `Transaction ${entry.credit ? "Credit" : "Debit"}`;
        }
        runningBalance += entry.credit - entry.debit;
        return {
          date: formatDate(entry.date),
          description,
          credit: entry.credit || 0,
          debit: entry.debit || 0,
          balance: runningBalance,
        };
      })
    );


    return res.status(200).json({
      uniqueCode: "CGP0177",
      message: "User ledger entries fetched successfully",
      data: { results: modifiedClientStatements },
    });
  } catch (error) {
    logger.error("Error fetching user ledger entries:", error);
    return res.status(500).json({
      uniqueCode: "CGP0178",
      message: "Internal server error",
      data: {},
    });
  }
};
