import { pool } from "../../../config/db.js";
import redis from "../../../config/redis.js";
import { logger } from "../../../logger/logger.js";
import { GAME_STATES, GAME_TYPES } from "../config/types.js";

export function getBetMultiplier(gameType, betSide) { //standalone function; not intended to be attatched as method
  switch (gameType) {
    case GAME_TYPES.ANDAR_BAHAR_TWO:
      return 1.96;

    case GAME_TYPES.LUCKY7B:
      const lucky7BMultipliers = {
        low: 1.96,
        high: 1.96,
        mid: 2.0,
        even: 2.1,
        odd: 1.79,
        black: 1.95,
        red: 1.95,
      };
      return lucky7BMultipliers[betSide] || 1;

    case GAME_TYPES.TEEN_PATTI:
      return 1.95;

    case GAME_TYPES.DRAGON_TIGER:
      const dragonTigerMultipliers = {
        dragon: 1.96,
        tiger: 1.96,
        tie: 8.0,
        pair: 6.0,
        odd: 1.79,
        even: 2.1,
        black: 1.95,
        red: 1.95,
        specificCard: 12.0,
      };
      return dragonTigerMultipliers[betSide] || 1;

    case GAME_TYPES.ANDAR_BAHAR:
      return 1.96;

    case GAME_TYPES.DRAGON_TIGER_LION:
      const dragonTigerLionMultipliers = {
        winner: 2.9,
        black: 1.97,
        red: 1.97,
        odd: 1.83,
        even: 2.42,
      };
      return dragonTigerLionMultipliers[betSide] || 1;

    default:
      throw new Error(`Unsupported game type: ${gameType}`);
  }
}

export function transformBets(betsMap, gameType) {
    // Get bet sides from game config
    const config = GAME_CONFIGS[gameType];
    if (!config) {
        throw new Error(`Invalid game type: ${gameType}`);
    }

    // Initialize bet totals with 0 for each possible bet side
    const betTotals = config.betSides.reduce((acc, side) => {
        acc[side.toLowerCase()] = 0;
        return acc;
    }, {});

    // Sum up stakes for each bet side
    for (const [userId, bets] of betsMap) {
        bets.forEach(bet => {
            const betSide = bet.side.toLowerCase();
            if (betTotals.hasOwnProperty(betSide)) {
                betTotals[betSide] += bet.stake;
            }
        });
    }

    return betTotals;
}

async function validateBetAmount(userId, amount, username) {
  try {
    // Get user's balance from MySQL
    const [rows] = await pool.query(
      `SELECT p.balance
                 FROM players p
                 JOIN users u ON p.userId = u.id
                 WHERE u.id = ?`,
      [userId],
    );

    if (rows.length === 0) {
      throw new Error("User not found");
    }

    const balance = rows[0].balance;

    if (balance < amount) {
      throw new Error("Insufficient balance");
    }

    // Get active bets from Redis
    const activeBets = await redis.hgetall(`user:${userId}:active_bets`);
    const totalActiveBets =
      Object.values(activeBets).reduce((sum, bet) => sum + parseInt(bet), 0) ||
      0;

    logger.info(
      `User ${username} - Balance: ${balance}, Active Bets: ${totalActiveBets}, New Bet: ${amount}`,
    );

    if (totalActiveBets + amount > balance) {
      throw new Error("Bet amount exceeds available balance");
    }

    return {};
  } catch (error) {
    logger.error("Error validating bet amount:", error);
    throw error;
  }
}

export async function placeBet(userId, side, amount) { //will be shifted to manager levelw
  if (this.status !== GAME_STATES.BETTING) { //repeat
    throw new Error("Betting is closed");
  }

  if (!this.betSides.includes(side)) {
    throw new Error(
      `Invalid bet option. Must be one of: ${this.betSides.join(", ")}`,
    );
  }

  try {
    // Start MySQL transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // First get the player's ID from the players table
      const [playerRows] = await connection.query(
        `SELECT id FROM players WHERE userId = ?`,
        [userId],
      );

      if (playerRows.length === 0) {
        throw new Error("Player not found");
      }

      const playerId = playerRows[0].id;

      // Validate bet amount
      await validateBetAmount(userId, amount);

      // Insert bet record using playerId instead of userId
      const [result] = await connection.query(
        `INSERT INTO bets (
                        roundId,
                        playerId,
                        betAmount,
                        betSide
                    ) VALUES (?, ?, ?, ?)`,
        [this.roundId, playerId, amount, side],
      );

      // Update player balance
      await connection.query(
        `UPDATE players
                     SET balance = balance - ?
                     WHERE userId = ?`,
        [amount, userId],
      );

      // Store in Redis for quick access during game
      await redis.hset(
        `bets:${this.roundId}`,
        userId,
        JSON.stringify({
          side,
          amount,
          betId: result.insertId,
          timestamp: Date.now(),
        }),
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error(`Failed to place bet for user ${userId}:`, error);
    throw new Error(error.message || "Failed to place bet");
  }
}
