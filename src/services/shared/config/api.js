import { getBetMultiplier } from "../helper/getBetMultiplier.js";
import SocketManager from "./socket-manager.js";
import { pool } from "../../../config/db.js";
import { logger } from "../../../logger/logger.js";
import { GAME_CONFIGS, GAME_STATES } from "./types.js";

export async function placeBet(userId, roundId, stake, side) {
  try {
    // Get game instance directly using roundId
    const game = this.getGameFromRoundId(roundId);

    // console.log(`request for ${game}`);
    // console.log("see:", this.activeGames);

    if (!game) {
      throw {
        uniqueCode: "CGP00G03",
        message: "Game not found",
        data: { success: false },
      };
    }

    // Check game status
    if (game.status !== "betting") {
      throw {
        uniqueCode: "CGP00G04",
        message: "Betting is not currently open for this game",
        data: { success: false },
      };
    }

    const lowercasedBetSides = game.betSides.map((s) => s.toLowerCase());

    // Validate bet side
    if (!lowercasedBetSides.includes(side.toLowerCase())) {
      throw {
        uniqueCode: "CGP00G05",
        message: `Invalid bet option. Must be one of: ${game.betSides.join(
          ", ",
        )}`,
        data: { success: false },
      };
    }

    // Get or initialize user's bets array
    const userBets = game.bets.get(userId) || [];

    const odd = await getBetMultiplier(game.gameType, side.toLowerCase());
    const amount = stake * odd;

    // Add new bet to array
    userBets.push({
      side,
      stake,
      odd,
      amount,
      timestamp: Date.now(),
    });

    // Update bets map
    game.bets.set(userId, userBets);

    // Start database transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get player details including betting limits from the hierarchy
      const [playerRows] = await connection.query(
        `SELECT
            p.id as playerId,
            p.balance,
            p.agentId,
            a.superAgentsId,
            sa.minBet,
            sa.maxBet
           FROM players p
           JOIN agents a ON p.agentId = a.id
           JOIN superAgents sa ON a.superAgentsId = sa.id
           WHERE p.userId = ?`,
        [userId],
      );

      if (playerRows.length === 0) {
        throw {
          uniqueCode: "CGP00G06",
          message: "Player not found",
          data: { success: false },
        };
      }

      const player = playerRows[0];

      // Validate balance
      if (player.balance < stake) {
        throw {
          uniqueCode: "CGP00G07",
          message: "Insufficient balance",
          data: { success: false },
        };
      }

      // Validate bet amount against superAgent limits
      if (stake < player.minBet || stake > player.maxBet) {
        throw {
          uniqueCode: "CGP00G08",
          message: `Bet amount must be between ${player.minBet} and ${player.maxBet}`,
          data: { success: false },
        };
      }

      // Insert bet record
      const [result] = await connection.query(
        `INSERT INTO bets (
            roundId,
            playerId,
            betAmount,
            betSide
          ) VALUES (?, ?, ?, ?)`,
        [roundId, player.playerId, stake, side],
      );

      // Update player balance
      const newBalance = player.balance - stake;
      await connection.query(
        `UPDATE players
           SET balance = ?
           WHERE id = ?`,
        [newBalance, player.playerId],
      );

      await connection.commit();

      // broadcast wallet update
      SocketManager.broadcastWalletUpdate(userId, newBalance);

      // broadcast stake update
      SocketManager.broadcastStakeUpdate(userId, roundId, {
        betId: result.insertId,
        stake,
        odd,
        amount,
        side,
        timestamp: Date.now(),
      });

      // console.log("bet placed successfully", {betId: result.insertId,
      //   stake,
      //   odd,
      //   amount,
      //   side,
      //   timestamp: Date.now(),
      // });

      return {
        uniqueCode: "CGP00G09",
        message: "Bet placed successfully",
        data: {
          success: true,
          betId: result.insertId,
          stake,
          odd,
          amount,
          side,
          balance: newBalance,
        },
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error(`Failed to place bet for user ${userId}:`, error);
    if (error.uniqueCode) {
      throw error;
    }
    throw {
      uniqueCode: "CGP00G10",
      message: error.message || "Failed to place bet",
      data: { success: false },
    };
  }
}
