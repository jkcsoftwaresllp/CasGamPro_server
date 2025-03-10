import { db } from "../../config/db.js";
import {
  rounds,
  games,
  bets,
  players,
  agents,
  users,
  superAgents,
  categories,
  betSides,
} from "../../database/schema.js";
import { sql, eq, and, desc } from "drizzle-orm";
import { format } from "date-fns";
import { logger } from "../../logger/logger.js";
import {
  getBetMultiplier,
  getBetMultiplierFromTypes,
} from "../../services/shared/helper/getBetMultiplier.js";

// Get main casino summary
export const getLiveCasinoReports = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        uniqueCode: "CGP0281",
        message: "User not found",
        data: {},
      });
    }

    let results = [];

    if (user.role === "AGENT") {
      // Get agent's ID and commission rate
      const [agent] = await db
        .select({
          id: agents.id,
          maxShare: agents.maxShare,
        })
        .from(agents)
        .where(eq(agents.userId, userId));

      if (!agent) {
        return res.status(403).json({
          uniqueCode: "CGP0282",
          message: "Not authorized as agent",
          data: {},
        });
      }

      // Get all categories with their total profit/loss (without date filter)
      const query = db
        .select({
          title: categories.name,
          date: sql`DATE(${rounds.createdAt})`,
          profitLoss: sql`
            SUM(
              CASE 
                WHEN ${bets.win} = 1 THEN -${bets.betAmount} 
                ELSE ${bets.betAmount}
              END
            ) * ${agent.maxShare} / 100
          `,
        })
        .from(categories)
        .innerJoin(games, eq(games.categoryId, categories.id))
        .innerJoin(rounds, eq(rounds.gameId, games.id))
        .innerJoin(bets, eq(bets.roundId, rounds.roundId))
        .innerJoin(players, eq(bets.playerId, players.id))
        .where(eq(players.agentId, agent.id))
        .groupBy(categories.name, sql`DATE(${rounds.createdAt})`)
        .orderBy(desc(sql`DATE(${rounds.createdAt})`));

      results = await query;
    } else if (user.role === "SUPERAGENT") {
      // Get super agent's ID and commission rate
      const [superAgent] = await db
        .select({
          id: superAgents.id,
          maxShare: superAgents.maxCasinoCommission,
        })
        .from(superAgents)
        .where(eq(superAgents.userId, userId));

      if (!superAgent) {
        return res.status(403).json({
          uniqueCode: "CGP0283",
          message: "Not authorized as super agent",
          data: {},
        });
      }

      const query = db
        .select({
          title: categories.name,
          date: sql`DATE(${rounds.createdAt})`,
          profitLoss: sql`
            SUM(
              CASE 
                WHEN ${bets.win} = 1 THEN -${bets.betAmount}
                ELSE ${bets.betAmount}
              END
            ) * ${superAgent.maxShare} / 100
          `,
        })
        .from(categories)
        .innerJoin(games, eq(games.categoryId, categories.id))
        .innerJoin(rounds, eq(rounds.gameId, games.id))
        .innerJoin(bets, eq(bets.roundId, rounds.roundId))
        .innerJoin(players, eq(bets.playerId, players.id))
        .innerJoin(agents, eq(players.agentId, agents.id))
        .where(eq(agents.superAgentId, superAgent.id))
        .groupBy(categories.name, sql`DATE(${rounds.createdAt})`)
        .orderBy(desc(sql`DATE(${rounds.createdAt})`));

      results = await query;
    }

    // Format dates and numbers
    const formattedResults = results.map((result) => ({
      ...result,
      date: format(new Date(result.date), "yyyy-MM-dd"),
      profitLoss: Number(result.profitLoss || 0).toFixed(2),
    }));

    return res.status(200).json({
      uniqueCode: "CGP0284",
      message: "Live casino reports fetched successfully",
      data: { results: formattedResults },
    });
  } catch (error) {
    logger.error("Error fetching live casino reports:", error);
    return res.status(500).json({
      uniqueCode: "CGP0285",
      message: "Error fetching live casino reports",
      data: { error: error.message },
    });
  }
};

// Get detailed game reports for a specific casino category
export const getLiveCasinoGameReports = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { categoryName, date } = req.params;

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        uniqueCode: "CGP0286",
        message: "User not found",
        data: {},
      });
    }

    let results = [];

    if (user.role === "AGENT") {
      // Get agent's ID and commission rates
      const [agent] = await db
        .select({
          id: agents.id,
          maxShare: agents.maxShare,
          maxCasinoCommission: agents.maxCasinoCommission,
        })
        .from(agents)
        .where(eq(agents.userId, userId));

      if (!agent) {
        return res.status(403).json({
          uniqueCode: "CGP0287",
          message: "Not authorized as agent",
          data: {},
        });
      }

      const dbResult = await db
        .select({
          betAmount: bets.betAmount,
          win: bets.win,
          betSide: bets.betSide,
          gameType: games.gameType,
        })
        .from(categories)
        .innerJoin(games, eq(games.categoryId, categories.id))
        .innerJoin(rounds, eq(rounds.gameId, games.id))
        .innerJoin(bets, eq(bets.roundId, rounds.roundId))
        .innerJoin(players, eq(bets.playerId, players.id))
        .where(
          and(
            eq(players.agentId, agent.id),
            eq(categories.name, categoryName),
            eq(sql`DATE(${rounds.createdAt})`, date)
          )
        );
      // console.log("dbResult: ", dbResult);

      const gameStats = dbResult.reduce((acc, entry) => {
        if (!acc[entry.gameType]) {
          acc[entry.gameType] = {
            totalBetAmount: 0,
            winningBets: 0,
            lossingBets: 0,
            winningAmount: 0,
          };
        }

        acc[entry.gameType].totalBetAmount += entry.betAmount;
        if (entry.win) {
          acc[entry.gameType].winningBets += entry.betAmount;
        }

        return acc;
      }, {});

      // Calculate winning amounts for each gameType asynchronously
      for (const gameType in gameStats) {
        gameStats[gameType].winningAmount = await Promise.all(
          dbResult
            .filter((entry) => entry.gameType === gameType)
            .map(async (entry) => {
              if (entry.win) {
                const multiplier = await getBetMultiplier(
                  entry.gameType,
                  entry.betSide
                );
                return entry.betAmount * multiplier;
              }
              return 0;
            })
        ).then((values) => values.reduce((sum, val) => sum + val, 0));

        gameStats[gameType].lossingBets =
          gameStats[gameType].winningBets - gameStats[gameType].totalBetAmount;

        // ---
        const { totalBetAmount, winningBets, lossingBets, winningAmount } =
          gameStats[gameType];

        // Clients --------

        const clientProfit = winningAmount - winningBets;
        const overallClientPL = clientProfit + lossingBets;

        // Herarchi -----------------------------------
        const overAllHerarchi = -overallClientPL;

        // Calculation for Agent Aspect
        const agentShare = (overAllHerarchi * agent.maxShare) / 100;
        const agentCommission =
          (totalBetAmount * agent.maxCasinoCommission) / 100;
        const agentPL = agentShare + agentCommission;
        const supperAgentPL = overAllHerarchi - agentPL;

        // console.log(`\n------------------ ${gameType} ----------------`);
        // console.log("Bet Amount: ", totalBetAmount, winningBets, lossingBets);
        // console.log("Winnging Bet Amount: ", winningAmount);
        // console.log("Client P/L: ", clientProfit, overallClientPL);
        // console.log("\nOver all herarchi: ", overAllHerarchi);
        // console.log("Agent P/L: ", agentShare, agentCommission, agentPL);
        // console.log("Herarchi: ", agentPL, supperAgentPL);

        results.push({
          date: date,
          betAmount: totalBetAmount,
          agentPL: agentPL,
          companyPL: supperAgentPL,
        });
      }
    }

    return res.status(200).json({
      uniqueCode: "CGP0289",
      message: "Game reports fetched successfully",
      data: { results },
    });
  } catch (error) {
    logger.error("Error fetching game reports:", error);
    return res.status(500).json({
      uniqueCode: "CGP0290",
      message: "Error fetching game reports",
      data: { error: error.message },
    });
  }
};
