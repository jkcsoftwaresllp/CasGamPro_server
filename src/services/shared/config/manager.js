import GameFactory from "./factory.js";
import { GAME_CONFIGS } from "./types.js";
import { pool } from "../../../config/db.js";
import { logger } from "../../../logger/logger.js";
import SocketManager from "./socket-manager.js";
import { getBetMultiplier } from "../helper/getBetMultiplier.js";

/* interface ActiveGames {
  gameType: string;
  users: Set<number>;
} */
const MAX_ROOM_USERS = 10;

class GameManager {
  constructor() {
    this.activeGames = new Map();
    this.gameSubscribers = new Map();
  }

  generateRoundId(gameType) {
    const config = this.getGameConfig(gameType);
    return `${config.id}_${Date.now()}`;
  }

  getGameById(x) {
    return;
  }

  deployGame(gameType) {
    const roundId = this.generateRoundId(gameType);
    const gameInstance = GameFactory.deployGame(gameType, roundId);
    this.activeGames.set(gameType, gameInstance);
    // console.info(`start game ${gameType}`);
    gameInstance.start();
    return gameInstance;
  }

  handleUserLeave(userId, gameType) {
    const subscribers = this.gameSubscribers.get(gameType);
    if (subscribers) {
      subscribers.delete(userId);
    }

    // Optional: Cleanup empty games
    if (subscribers.size === 0) {
      this.activeGames.delete(gameType);
      this.gameSubscribers.delete(gameType);
    }
  }

  getGameInstance(gameType) {
    return this.activeGames.get(gameType);
  }

  getGameConfig(gameType) {
    return GAME_CONFIGS[gameType];
  }

  endGame(gameType) {
    const game = this.activeGames.get(gameType);
    if (!game) return;

    // Clear bets
    game.bets.clear();

    // Deploy new game instance
    this.deployGame(gameType);
  }

  getActiveGames() {
    return Array.from(this.activeGames.values());
  }

  getGameByRoundId(roundId) {
    return this.activeGames.get(roundId);
  }

  async handleUserJoin(userId, newGameType) {
    try {
      // 1. Validate user
      const [userRow] = await pool.query(
        `SELECT u.id, u.blocking_levels, p.balance
           FROM users u
           JOIN players p ON u.id = p.userId
           WHERE u.id = ?`,
        [userId],
      );

      if (!userRow.length || userRow[0].blocking_levels !== "NONE") {
        throw new Error("User not authorized to join games");
      }

      // 2. Check if user is in another game
      for (const [gameType, subscribers] of this.gameSubscribers) {
        if (subscribers.has(userId)) {
          if (gameType === newGameType) {
            // Same game - return current state
            const gameInstance = this.getGameInstance(gameType);
            return gameInstance.getGameState();
          }
          // Different game - remove from current game
          this.handleUserLeave(userId, gameType);
          break;
        }
      }

      // 3. Create game if doesn't exist
      if (!this.activeGames.has(newGameType)) {
        this.deployGame(newGameType);
      }

      // 4. Initialize subscriber set if needed
      if (!this.gameSubscribers.has(newGameType)) {
        this.gameSubscribers.set(newGameType, new Set());
      }

      // 5. Add user to new game
      this.gameSubscribers.get(newGameType).add(userId);

      // 6. Return game state
      const gameInstance = this.getGameInstance(newGameType);
      return gameInstance.getGameState();
    } catch (error) {
      logger.error(`Failed to handle user join: ${error.message}`);
      throw error;
    }
  }

  getGameFromRoundId(roundId) {
    for (const gameInstance of this.activeGames.values()) {
      if (gameInstance.roundId === roundId) {
        return gameInstance;
      }
    }
    return null;
  }

  async placeBet(userId, roundId, stake, side) {
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

  logRoomServiceDetailed() {
    // console.log("\n=== Room Service Structure ===");

    if (this.roomService.size === 0) {
      // console.log("No active rooms");
      return;
    }

    for (const [gameType, rooms] of this.roomService) {
      // console.log(`\nGame Type: ${gameType}`);

      if (rooms.size === 0) {
        console.log("  No rooms");
        continue;
      }

      for (const [roomId, roomData] of rooms) {
        // console.log(`  Room ${roomId}:`);
        // console.log(`    Users: [${Array.from(roomData.users).join(", ")}]`);
        // console.log(`    Total Users: ${roomData.users.size}`);
      }
    }
    // console.log("\n===========================");
  }

  printRoomService() {
    const printableStructure = {};

    // Iterate through the outer Map (gameType -> rooms)
    for (const [gameType, rooms] of this.roomService) {
      printableStructure[gameType] = {};

      // Iterate through the inner Map (roomId -> room data)
      for (const [roomId, roomData] of rooms) {
        printableStructure[gameType][roomId] = {
          users: Array.from(roomData.users), // Convert Set to Array
        };
      }
    }

    // console.log("Room Service Structure:");
    // console.log(JSON.stringify(printableStructure, null, 2));
  }
}

export default new GameManager();
