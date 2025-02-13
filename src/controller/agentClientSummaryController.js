import { db } from '../config/db.js';
import { players, bets, ledger, agents } from '../database/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '../logger/logger.js';

export const getClientSummary = async (req, res) => {
  try {
    const { roundId, gameId } = req.query;
    const agentId = req.session.userId;

    if (!roundId || !gameId) {
      return res.status(400).json({
        uniqueCode: 'CGP0099',
        message: 'Round ID and Game ID are required',
        data: {}
      });
    }

    // Validate agent
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, agentId));

    if (!agent) {
      return res.status(403).json({
        uniqueCode: 'CGP0100',
        message: 'Not authorized as agent',
        data: {}
      });
    }

    // Get all players under this agent
    const agentPlayers = await db
      .select({ id: players.id, balance: players.balance })
      .from(players)
      .where(eq(players.agentId, agent.id));

    if (!agentPlayers.length) {
      return res.status(200).json({
        uniqueCode: 'CGP0101',
        message: 'No players found for this agent',
        data: []
      });
    }

    const playerIds = agentPlayers.map(p => p.id);

    // Get bets placed by players for the specified round and game
    const betsData = await db
      .select({
        playerId: bets.playerId,
        betAmount: bets.betAmount,
        win: bets.win
      })
      .from(bets)
      .where(and(
        eq(bets.roundId, parseInt(roundId)),
        eq(bets.gameId, parseInt(gameId)),
        sql`${bets.playerId} IN (${playerIds.join(',')})`
      ));

    let totalBets = 0;
    let totalWinnings = 0;
    let totalDebits = 0;
    let totalCredits = 0;

    betsData.forEach(bet => {
      totalBets += bet.betAmount;
      if (bet.win) {
        totalWinnings += bet.betAmount;
        totalCredits += bet.betAmount;
      } else {
        totalDebits += bet.betAmount;
      }
    });

    const agentProfitLoss = totalDebits - totalCredits;

    // Update agent ledger
    await db.insert(ledger).values({
      userId: agentId,
      date: new Date(),
      entry: 'Agent profit/loss for round',
      debit: agentProfitLoss < 0 ? Math.abs(agentProfitLoss) : 0,
      credit: agentProfitLoss > 0 ? agentProfitLoss : 0,
      balance: agent.balance + agentProfitLoss,
      roundId: parseInt(roundId),
      amount: agentProfitLoss,
      status: agentProfitLoss > 0 ? 'WIN' : 'LOSS'
    });

    return res.status(200).json({
      uniqueCode: 'CGP0097',
      message: 'Client summary fetched successfully',
      data: {
        totalBets,
        totalWinnings,
        totalDebits,
        totalCredits,
        agentProfitLoss,
        currentAgentBalance: agent.balance + agentProfitLoss
      }
    });

  } catch (error) {
    logger.error('Error fetching client summary:', error);
    return res.status(500).json({
      uniqueCode: 'CGP0098',
      message: 'Internal server error',
      data: {}
    });
  }
};