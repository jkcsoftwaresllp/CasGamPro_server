import GameFactory from "./factory.js";
import { GAME_CONFIGS } from "./types.js";
import { pool } from "../../../config/db.js";
import { logger } from "../../../logger/logger.js";
import SocketManager from "./socket-manager.js";
import { getBetMultiplier } from "../helper/getBetMultiplier.js";

/* interface RoomService {
  gameType: string;              // Type of game (e.g., "Chess")
  rooms: Map<number, {           // Map rooms by their room ID (number)
    users: Set<number>;          // Set of userIds (unique players in the room)
  }>;
} */
const MAX_ROOM_USERS = 10;

class GameManager {
  constructor() {
    this.roomService = new Map();
  }

  findAvailableRooms(userId, rooms) {
    console.info("Target Room:", rooms);

    for (const [roomId, room] of rooms) {
      if (room.users.size < MAX_ROOM_USERS) {
        return roomId;
      }
    }

    return null; // if no available room found
  }

  createNewRoom(userId) {
    // generate room Id
    const roomId = 1;
    return new Map([
      [roomId, { users: new Set([userId]) }]
    ]);
  }

  deployGame(userId, gameType) {

      const config = this.getGameConfig(gameType);
      if (!config) {
        throw new Error(`Invalid game type: ${gameType}`);
      }

      const roundId = `${config.id}_${Date.now()}`;
      GameFactory.deployGame(gameType, roundId, roomId);

      console.info("No room found for the requested game...deploying a new room");
      this.roomService.set(gameType, this.createNewRoom(userId));
  }

  checkInRoom(userId, gameType) {
    // this.printRoomService();
    this.logRoomServiceDetailed();
    const rooms = this.roomService.get(gameType);

    // deploy game
    if (!rooms) {
      this.deployGame(userId, gameType);
      return;
    };

    // Finding available room
    console.log("Finding available room...");

    const availableRoom = this.findAvailableRooms(userId, rooms); // availableRoom = roomId

    if (availableRoom) {
      // assigning room (if found)
      rooms.get(availableRoom).users.add(userId);
    } else {
      // creating new room just for you
      const newRoomId = 1;
      rooms.set(newRoomId, { users: new Set([userId]) });
    }
  }

  getGameConfig(gameType) {
    return GAME_CONFIGS[gameType];
  }

  async checkAndStartNewGame(roomId) {
    console.log(`checkig for ${roomId}`);
    const room = this.gameRooms.get(roomId);
    if (!room || room.users.size === 0) return;

    // Only create a new game if there's no active game
    if (!room.currentGame) {
      const game = await this.createNewGame(room.gameType, roomId);
      room.currentGame = game;
      this.logSessionStatus();
      await game.start();
    } else {
      console.log("assigning existing game")
    }
  }

  async createNewGame(gameType, roomId) {
    try {
      this.activeGames.set(roundId, gameInstance);

      return gameInstance;
    } catch (error) {
      logger.error("Failed to create new game:", error);
      throw error;
    }
  }

  findOrCreateRoom(gameType) {
    // Find existing room with capacity
    for (let [roomId, room] of this.gameRooms) {
      if (room.gameType === gameType && room.users.size < room.maxClients) {
        return room;
      }
    }

    console.info("Creating new room");

    // Create new room
    const roomId = `${gameType}_ROOM_${Date.now()}`;
    const room = {
      id: roomId,
      gameType,
      currentGame: null,
      users: new Set(), // Track users instead of just count
      maxClients: 10,
    };
    this.gameRooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId, userId) {
    const room = this.gameRooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    room.users.add(userId);
  }

  leaveRoom(roomId, userId) {
    const room = this.gameRooms.get(roomId);
    if (room) {
      room.users.delete(userId);
      if (room.users.size === 0) {
        this.gameRooms.delete(roomId);
      }
    }
  }

  endGame(roundId, roomId) {
    const game = this.activeGames.get(roundId);
    if (!game) return;

    // reset map
    game.bets.clear();

    const room = this.gameRooms.get(game.roomId);
    if (room) {
      // Clear current game
      room.currentGame = null;

      // If room is empty, clean it up
      if (room.users.size === 0) {
        this.gameRooms.delete(game.roomId);
      }
    }

    this.activeGames.delete(roundId);

    this.checkAndStartNewGame(roomId);
  }

  getActiveGames() {
    return Array.from(this.activeGames.values());
  }

  getGameByRoundId(roundId) {
    return this.activeGames.get(roundId);
  }

  async handleUserJoin(userId, newGameType) {
    try {
      // Validate user exists and is active
      const [userRow] = await pool.query(
        `SELECT u.id, u.blocking_levels, p.balance
               FROM users u
               JOIN players p ON u.id = p.userId
               WHERE u.id = ?`,
        [userId]
      );

      // console.log("userRow", userRow);
      // console.log("checkpoint #1");

      if (!userRow.length || userRow[0].blocking_levels !== "NONE") {
        throw new Error("User not authorized to join games");
      }

      // Check if user is already in a game
      if (this.userSessions.has(userId)) {
        console.log("user existing:", this.userSessions[userId]);
        const currentSession = this.userSessions.get(userId);

        // If trying to join the same game type, just return current game state
        if (currentSession.gameType === newGameType) {
          const currentRoom = this.gameRooms.get(currentSession.roomId);
          return {
            roomId: currentRoom.id,
            gameState: currentRoom.currentGame.getGameState(),
          };
        }

        // console.log("checkpoint #2");

        // If trying to join different game, remove from current game first
        logger.info(
          `User ${userId} switching from ${currentSession.gameType} to ${newGameType}`
        );
        await this.handleUserLeave(userId);
      }

      // Find or create appropriate room for new game
      const room = this.findOrCreateRoom(newGameType);

      // console.log("checkpoint #3");

      // If this is the first user in the room, create a new game
      if (room.users.size === 0) {
        const game = await this.createNewGame(newGameType, room.id);
        room.currentGame = game;
        await game.start();
      }

      // Add user to new room
      room.users.add(userId);
      this.userSessions.set(userId, {
        roomId: room.id,
        gameType: newGameType,
        joinedAt: Date.now(),
      });

      // console.log("checkpoint #4");

      // Notify through socket that user has switched games
      SocketManager.notifyGameSwitch(userId, newGameType);

      // console.log("checkpoint #5");

      return {
        roomId: room.id,
        gameState: room.currentGame.getGameState(),
      };
    } catch (error) {
      logger.error(`Failed to handle user join: ${error.message}`);
      throw error;
    }
  }

  async handleUserLeave(userId) {
    const session = this.userSessions.get(userId);
    if (!session) return;

    const room = this.gameRooms.get(session.roomId);
    if (room) {
      // Remove user from room
      room.users.delete(userId);

      // If room is empty, clean up the game
      if (room.users.size === 0) {
        if (room.currentGame) {
          this.endGame(room.currentGame.roundId);
        }
        this.gameRooms.delete(session.roomId);
      }
    }

    this.userSessions.delete(userId);
  }

  async getUserStakes(userId, roundId) {
    const game = this.activeGames.get(roundId);
    if (!game) return [];

    const userBets = game.bets.get(userId) || [];
    return userBets.map(bet => ({
      ...bet,
      roundId
    }));
  }

  async placeBet(userId, roundId, stake, side) {
    try {
      // Get game instance directly using roundId
      const game = this.activeGames.get(roundId);
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

      const lowercasedBetSides = game.betSides.map(s => s.toLowerCase());

      // Validate bet side
      if (!lowercasedBetSides.includes(side.toLowerCase())) {
        throw {
          uniqueCode: "CGP00G05",
          message: `Invalid bet option. Must be one of: ${game.betSides.join(
            ", "
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
          [newBalance, player.playerId]
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
          timestamp: Date.now()
        });


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
    console.log('\n=== Room Service Structure ===');

    if (this.roomService.size === 0) {
      console.log('No active rooms');
      return;
    }

    for (const [gameType, rooms] of this.roomService) {
      console.log(`\nGame Type: ${gameType}`);

      if (rooms.size === 0) {
        console.log('  No rooms');
        continue;
      }

      for (const [roomId, roomData] of rooms) {
        console.log(`  Room ${roomId}:`);
        console.log(`    Users: [${Array.from(roomData.users).join(', ')}]`);
        console.log(`    Total Users: ${roomData.users.size}`);
      }
    }
    console.log('\n===========================');
  }

  printRoomService() {
    const printableStructure = {};

    // Iterate through the outer Map (gameType -> rooms)
    for (const [gameType, rooms] of this.roomService) {
      printableStructure[gameType] = {};

      // Iterate through the inner Map (roomId -> room data)
      for (const [roomId, roomData] of rooms) {
        printableStructure[gameType][roomId] = {
          users: Array.from(roomData.users) // Convert Set to Array
        };
      }
    }

    console.log('Room Service Structure:');
    console.log(JSON.stringify(printableStructure, null, 2));
  }
}



export default new GameManager();
