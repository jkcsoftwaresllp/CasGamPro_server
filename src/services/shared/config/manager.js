import GameFactory from "./factory.js";
import { GAME_CONFIGS, GAME_STATES } from "./types.js";
import { GAME_CONFIGS, GAME_STATES } from "./types.js";
import { pool } from "../../../config/db.js";
import { logger } from "../../../logger/logger.js";
import SocketManager from "./socket-manager.js";
import { getBetMultiplier } from "../helper/getBetMultiplier.js";
import { placeBet } from "./api.js";

/*

  interface GamePool {
    "<gameType>": "<instance>",
    "<gameType>": "<instance>",
    "<gameType>": "<instance>",
    "<gameType>": "<instance>",
  }

  interface GameSubscribers {
    "<gameType>": "users::set()",
    "<gameType>": "users::set()",
    "<gameType>": "users::set()",
    "<gameType>": "users::set()",
  }

*/
import { getBetMultiplier } from "../helper/getBetMultiplier.js";
import { placeBet } from "./api.js";

/*

  interface GamePool {
    "<gameType>": "<instance>",
    "<gameType>": "<instance>",
    "<gameType>": "<instance>",
    "<gameType>": "<instance>",
  }

  interface GameSubscribers {
    "<gameType>": "users::set()",
    "<gameType>": "users::set()",
    "<gameType>": "users::set()",
    "<gameType>": "users::set()",
  }

*/

class GameManager {
  constructor() {
    this.gameSubscribers = new Map(); // -- User Management
    this.gamePool = new Map(); // -- Lifecycle Management
  }

  /*  ---------- USER MANAGEMENT ---------- */

  getGameFromMapByUserId(userId) {
    for (let [gameType, users] of this.gameSubscribers.entries()) {
      if (users.has(userId)) {
        return gameType;
      }
    }
    return null;
  }

  addToMap(gameType, userId) {
    if (!this.gameSubscribers.has(gameType)) {
      // Initialize new Set if gameType doesn't exist
      this.gameSubscribers.set(gameType, new Set());
    }

    // Now we can safely add the user
    this.gameSubscribers.get(gameType).add(userId);
  }

  removeFromMap(gameType, userId) {
    const game_map = this.gameSubscribers.get(gameType);
    if (game_map) {
      // Check if game_map exists
      game_map.delete(userId);
    }
  }

  async handleUserJoin(userId, gameType) { // Its job is to return game state
    try {
      const existing_gameType = this.getGameFromMapByUserId(userId);
      if (existing_gameType) {

        if (existing_gameType === gameType) {
          logger.info(`User ${userId} already in game ${gameType}`);
          return this.getGameInstance(gameType).getGameState();
        }

        this.removeFromMap(existing_gameType, userId);
        this.addToMap(gameType, userId);
        const gameInstance = this.gamePool.get(gameType);
        if (gameInstance) {
          return gameInstance.getGameState();
        }

        const new_gameInstance = await this.startGame(gameType);

        // Return game state
        return new_gameInstance.getGameState();
      }

      // Validate user
      const [userRow] = await pool.query(
        `SELECT u.id, u.blocking_levels, p.balance
           FROM users u
           JOIN players p ON u.id = p.userId
           WHERE u.id = ?`,
        [userId],
           FROM users u
           JOIN players p ON u.id = p.userId
           WHERE u.id = ?`,
        [userId],
      );

      if (!userRow.length || userRow[0].blocking_levels !== "NONE") {
        throw new Error("User not authorized to join games");
      }

      // Add user to the game
      this.addToMap(gameType, userId);

      // Start or get existing game
      const gameInstance = await this.startGame(gameType);

      // Return game state
      return gameInstance.getGameState();
    } catch (error) {
      logger.error(`Failed to handle user join: ${error.message}`);
      throw error;
    }
  }

  async handleUserLeave(userId, gameType) {
    try {
      if (gameType) {
        this.removeFromMap(gameType, userId);
        logger.info(`User ${userId} left game ${gameType}`);
      }
    } catch (error) {
      logger.error(`Error handling user leave: ${error}`);
    }
  }

  async cleanupGame(gameType) {
    const gameInstance = this.gamePool.get(gameType);
    if (gameInstance) {
      gameInstance.clearStateTimeout();
      this.removeGameInstance(gameType);
    }
  }

  /* ---------- GAME LIFECYCLE MANAGEMENT ---------- */

  createGameInstance(gameType) {
    // Check if game instance already exists
    const existing_gameInstance = this.gamePool.get(gameType);
    if (existing_gameInstance) {
      return existing_gameInstance;
    }

    // Deploy a new game instance
    const roundId = this.generateRoundId(gameType);
    const gameInstance = GameFactory.deployGame(gameType, roundId);

    this.gamePool.set(gameType, gameInstance);

    return gameInstance;
  }

  removeGameInstance(gameType) {
    const userMap = this.gameSubscribers.get(gameType);
    if (!userMap || userMap.size === 0) {
      // Changed condition
      this.gameSubscribers.delete(gameType);
      this.gamePool.delete(gameType);
      return true;
    }

    console.info("Not removing the game, users still present!");
    return false;
  }

  run(gameInstance) {
    gameInstance.next();
  }

  nextStage(g) {
    switch (g.status) {
      case GAME_STATES.WAITING:
        g.betting();
      case GAME_STATES.BETTING:
        g.calculateResult();
        g.dealing();
      case GAME_STATES.DEALING:
        g.end();
      case GAME_STATES.COMPLETED:
        g.reset();
        g.start();
    }
  }

  async startGame(gameType) {
    logger.info(`Starting game: ${gameType}`);

    try {
      // Get or create game instance
      const gameInstance = this.createGameInstance(gameType);

      // Only initialize if game is new or completed
      if (
        gameInstance.status === null ||
        gameInstance.status === GAME_STATES.COMPLETED
      ) {
        logger.info(`Initializing game state to WAITING`);
        await gameInstance.changeState(GAME_STATES.WAITING);
      } else {
        logger.info(`Game already running in state: ${gameInstance.status}`);
      }

      return gameInstance;
    } catch (error) {
      logger.error(`Failed to start game: ${error}`);
      throw error;
    }
  }

  async endGame(gameType) {
    try {
      const gameInstance = this.gamePool.get(gameType);
      if (gameInstance && gameInstance.status === GAME_STATES.COMPLETED) {
        const subscribers = this.gameSubscribers.get(gameType);
        if (!subscribers || subscribers.size === 0) {
          logger.info(`No active subscribers, cleaning up game ${gameType}`);
          this.gamePool.delete(gameType);
          this.gameSubscribers.delete(gameType);
        } else {
          logger.info(
            `${subscribers.size} active subscribers, starting new round for ${gameType}`,
          );
          await this.startGame(gameType); // Start new round
        }
      }
    } catch (error) {
      logger.error(`Failed to end game: ${error}`);
      await this.restartGame(gameType);
    }
  }

  async restartGame(gameType) {
    logger.info(`Restarting game: ${gameType}`);

    const gameInstance = this.gamePool.get(gameType);
    if (gameInstance) {
      gameInstance.clearStateTimeout();
      this.gamePool.delete(gameType);
    }

    return await this.startGame(gameType);
  }

  generateRoundId(gameType) {
    const config = this.getGameConfig(gameType);
    return `${config.id}_${Date.now()}`;
  }

  getGameConfig(gameType) {
    return GAME_CONFIGS[gameType];
  }

  getGameInstance(gameType) {
    return this.gamePool.get(gameType);
  }

  getGameFromRoundId(roundId) {
    for (let [_, gameInstance] of this.gamePool.entries()) {
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
            ", ",
          )}`,
          data: { success: false },
        };
      }

      // Get or initialize user's bets array
      const userBets = game.bets.get(userId) || [];

      const odd = await getBetMultiplier(game.gameType, side.toLowerCase());
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


}

export default new GameManager();
