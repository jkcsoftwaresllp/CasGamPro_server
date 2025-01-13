import { pool } from "../../../config/db.js";
import redis from "../../../config/redis.js";
import { GAME_STATES } from "../config/types.js";

export async function validateBetAmount(userId, amount, username) {
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
			Object.values(activeBets).reduce(
				(sum, bet) => sum + parseInt(bet),
				0,
			) || 0;

		console.log(
			`User ${username} - Balance: ${balance}, Active Bets: ${totalActiveBets}, New Bet: ${amount}`,
		);

		if (totalActiveBets + amount > balance) {
			throw new Error("Bet amount exceeds available balance");
		}

		return true;
	} catch (error) {
		console.error("Error validating bet amount:", error);
		throw error;
	}
}

export async function processBetResults() {
	const connection = await pool.getConnection();
	try {
		await connection.beginTransaction();

		const bets = await redis.hgetall(`bets:${this.gameId}`);

		for (const [userId, betData] of Object.entries(bets)) {
			const bet = JSON.parse(betData);
			const won = bet.side === this.winner;
			const multiplier = await this.getBetMultiplier(bet.side);
			const payout = won ? bet.amount * multiplier : 0;

			// Update bet in MySQL
			await connection.query(
				`UPDATE bets
                 SET win = ?,
                     payoutAmount = ?
                 WHERE id = ?`,
				[won, payout, bet.betId],
			);

			// Update player balance if won
			if (won) {
				await connection.query(
					`UPDATE players
                     SET balance = balance + ?
                     WHERE userId = ?`,
					[payout, userId],
				);
			}
		}

		await connection.commit();
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
}

export async function placeBet(userId, side, amount) {
	if (this.status !== GAME_STATES.BETTING) {
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
			await this.validateBetAmount(userId, amount);

			// Insert bet record using playerId instead of userId
			const [result] = await connection.query(
				`INSERT INTO bets (
                        gameId,
                        playerId,
                        betAmount,
                        betSide
                    ) VALUES (?, ?, ?, ?)`,
				[this.gameId, playerId, amount, side],
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
				`bets:${this.gameId}`,
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
		console.error(`Failed to place bet for user ${userId}:`, error);
		throw new Error(error.message || "Failed to place bet");
	}
}
