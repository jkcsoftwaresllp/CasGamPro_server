import redis from "../../../config/redis.js";
import { GAME_STATES } from "./types.js";
import { pool } from "../../../config/db.js";
import { broadcastGameState } from "./handler.js";

class BaseGame {
	constructor(gameId) {
		this.gameId = gameId; // TODO: Make this shorter
		this.status = GAME_STATES.WAITING;
		this.startTime = null;
		this.winner = null;
		this.deck = this.initializeDeck();
		this.gameInterval = null;
		this.BETTING_PHASE_DURATION = 30000;
		this.CARD_DEAL_INTERVAL = 500;

		this.bets = new Map(); // Add this to track bets
		this.validBetOptions = []; // Will be set by

		this.recoverState();
	}

	getValidBetOptions() {
		throw new Error(
			"getValidBetOptions must be implemented by child class",
		);
	}

	async getBetMultiplier(betSide) {
		throw new Error("getBetMultiplier must be implemented by child class");
	}

	initializeDeck() {
		const ranks = [
			"2",
			"3",
			"4",
			"5",
			"6",
			"7",
			"8",
			"9",
			"10",
			"J",
			"Q",
			"K",
			"A",
		];
		let deck = [];
		for (let i = 0; i < 4; i++) {
			deck = deck.concat(ranks);
		}
		return deck.sort(() => Math.random() - 0.5);
	}

	/* ABSTRACT FUNCTIONS */
	start() {
		throw new Error("Start method must be implemented");
	}
	end() {
		throw new Error("End method must be implemented");
	}
	logSpecificGameState() {}

	async saveState() {
		try {
			console.log("Saving game state...", this.gameId);

			await redis.hmset(`game:${this.gameId}`, {
				status: this.status,
				startTime: this.startTime,
				winner: this.winner || "",
				deck: JSON.stringify(this.deck),
			});

			// Broadcast state change using Socket.IO
			broadcastGameState(this);

			console.log("State broadcast complete");
		} catch (error) {
			console.error(
				`Failed to save game state for ${this.gameId}:`,
				error,
			);
		}
	}

	async recoverState() {
		try {
			const state = await redis.hgetall(`game:${this.gameId}`);
			if (state && Object.keys(state).length) {
				this.status = state.status;
				this.startTime = state.startTime;
				this.winner = state.winner || null;
				this.deck = JSON.parse(state.deck);
			}
		} catch (error) {
			console.error(
				`Failed to recover game state for ${this.gameId}:`,
				error,
			);
		}
	}

	async clearState() {
		try {
			await redis.del(`game:${this.gameId}`);
		} catch (error) {
			console.error(
				`Failed to clear game state for ${this.gameId}:`,
				error,
			);
		}
	}

	logGameState(event) {
		console.log("Danishan: BaseGame.js");
		// console.log(`\n=== ${this.gameId} - ${event} ===`);
		// console.log("Type:", this.constructor.name);
		// console.log("Status:", this.status);
		// console.log("Winner:", this.winner);
		// this.logSpecificGameState(); // Implemented by child classes
		// console.log("Time:", new Date().toLocaleTimeString());
		// console.log("===============================\n");
	}

	async validateBetAmount(userId, amount, username) {
		console.log(`${username} is placing bet...`);

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
			const activeBets = await redis.hgetall(
				`user:${userId}:active_bets`,
			);
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

	async processBetResults() {
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

	async placeBet(userId, side, amount) {
		if (this.status !== GAME_STATES.BETTING) {
			throw new Error("Betting is closed");
		}

		const validOptions = this.getValidBetOptions();
		if (!validOptions.includes(side)) {
			throw new Error(
				`Invalid bet option. Must be one of: ${validOptions.join(", ")}`,
			);
		}

		try {
			// Start MySQL transaction
			const connection = await pool.getConnection();
			await connection.beginTransaction();

			try {
				// Validate bet amount
				await this.validateBetAmount(userId, amount);

				// Insert bet record
				const [result] = await connection.query(
					`INSERT INTO bets (
                            matchId,
                            playerId,
                            betAmount,
                            betSide,
                        ) VALUES (?, ?, ?, ?)`,
					[this.gameId, userId, amount, side],
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
}

export default BaseGame;
