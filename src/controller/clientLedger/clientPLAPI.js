import { db } from "../../config/db.js";
import {
  ledger,
  rounds,
  users,
  coinsLedger,
  agents,
  players,
  bets,
} from "../../database/schema.js";
import { desc, eq, sql } from "drizzle-orm";
import { getGameName } from "../../utils/getGameName.js";
import { convertToDelhiISO, formatDate } from "../../utils/formatDate.js";

const getPrefixBeforeUnderscore = (roundId) => {
  return roundId ? roundId.split("_")[0] : "";
};

export const clientPL_API = async (req, res) => {
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
    let profitLossData = [];

    // Fetch profit/loss data for all players
    const clientData = await db
      .select({
        date: rounds.createdAt,
        roundId: rounds.roundId,
        gameId: rounds.gameId,
        roundEarning: sql`
               COALESCE(
                 SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END), 
                 0
               )
             `,
        commissionEarning: sql`
               COALESCE(SUM(${bets.betAmount} * ${agent.commission} / 100), 0)
             `,
        totalEarning: sql`
               COALESCE(
                 SUM(${bets.betAmount}) - SUM(CASE WHEN ${bets.win} = true THEN ${bets.betAmount} ELSE 0 END) + 
                 SUM(${bets.betAmount} * ${agent.commission} / 100),
                 0
               )
             `,
      })
      .from(rounds)
      .leftJoin(bets, eq(bets.roundId, rounds.roundId))
      .leftJoin(players, eq(players.id, bets.playerId))
      .where(eq(players.id, userId))
      .groupBy(rounds.roundId)
      .orderBy(desc(rounds.createdAt));

    console.log(clientData);

    if (clientData.length > 0) {
      profitLossData = await Promise.all(
        clientData.map(async (row) => {
          const gameName = await getGameName(row.gameId); // Await the async call

          return {
            date: formatDate(row.date),
            roundId: row.roundId.toString(),
            roundTitle: gameName, // Ensure roundTitle is set
            roundEarning: parseFloat(row.roundEarning),
            commissionEarning: parseFloat(row.commissionEarning),
            totalEarning: parseFloat(row.totalEarning),
          };
        })
      );
    }

    res.json({
      uniqueCode: "CGP0164",
      message: "Profit & loss data fetch",
      data: { results: profitLossData },
    });
  } catch (error) {
    console.error("Error fetching client statement:", error);
    res.status(500).json({
      uniqueCode: "CGP0165",
      message: "Internal server error",
      data: {},
    });
  }
};
