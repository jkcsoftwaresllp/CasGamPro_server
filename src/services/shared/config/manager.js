import GameFactory from "./factory.js";
import { GAME_CONFIGS } from "./types.js";
import redis from "../../../config/redis.js";
import { logger } from "../../../logger/logger.js";
import SocketManager from "./socket-manager.js";

class GameManager {
  constructor() {
    this.activeGames = new Map(); // roundId -> gameInstance
    this.gameRooms = new Map(); // roomId -> {gameType, games[], clientCount}
    this.userSessions = new Map();
  }

  getGameConfig(gameType) {
    return GAME_CONFIGS.find((config) => config.type === gameType);
  }

  async createNewGame(gameType) {
    try {
      const config = this.getGameConfig(gameType);
      if (!config) {
        throw new Error(`Invalid game type: ${gameType}`);
      }

      // Get or create room
      let room = this.getOrCreateRoom(gameType);

      // Create new game instance
      const roundId = `${config.id}_${Date.now()}`;
      const gameInstance = GameFactory.deployGame(gameType, roundId, room.id);

      // Store game instance
      this.activeGames.set(roundId, gameInstance);
      room.games.push(gameInstance);

      return gameInstance;
    } catch (error) {
      logger.error("Failed to create new game:", error);
      throw error;
    }
  }

  getOrCreateRoom(gameType) {
    // Find existing room with capacity
    for (let [roomId, room] of this.gameRooms) {
      if (room.gameType === gameType && room.clientCount < room.maxClients) {
        return room;
      }
    }

    // Create new room
    const roomId = `${gameType}_ROOM_${Date.now()}`;
    const room = {
      id: roomId,
      gameType,
      games: [],
      clientCount: 0,
      maxClients: 10,
    };
    this.gameRooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId, clientId) {
    const room = this.gameRooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    room.clientCount++;
    // Track client connection
  }

  leaveRoom(roomId, clientId) {
    const room = this.gameRooms.get(roomId);
    if (room) {
      room.clientCount--;
      if (room.clientCount <= 0) {
        // Clean up empty room
        this.gameRooms.delete(roomId);
      }
    }
  }

  endGame(roundId) {
    const game = this.activeGames.get(roundId);
    if (!game) return;

    const room = this.gameRooms.get(game.roomId);
    if (room) {
      // Remove game from room
      room.games = room.games.filter((g) => g.roundId !== roundId);

      if (room.clientCount <= 0 && room.games.length === 0) {
        // Clean up empty room
        this.gameRooms.delete(game.roomId);
      }
    }

    // Remove game instance
    this.activeGames.delete(roundId);
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
        [userId],
      );

      if (!userRow.length || userRow[0].blocking_levels !== "NONE") {
        throw new Error("User not authorized to join games");
      }

      // Check if user is already in a game
      if (this.userSessions.has(userId)) {
        const currentSession = this.userSessions.get(userId);

        // If trying to join the same game type, just return current game state
        if (currentSession.gameType === newGameType) {
          const currentRoom = this.gameRooms.get(currentSession.roomId);
          return {
            roomId: currentRoom.id,
            gameState: currentRoom.currentGame.getGameState(),
          };
        }

        // If trying to join different game, remove from current game first
        logger.info(
          `User ${userId} switching from ${currentSession.gameType} to ${newGameType}`,
        );
        await this.handleUserLeave(userId);
      }

      // Find or create appropriate room for new game
      const room = this.findOrCreateRoom(newGameType);

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

      // Notify through socket that user has switched games
      SocketManager.notifyGameSwitch(userId, newGameType);

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

      // Cancel any active bets for this user in current round
      await this.cancelActiveBets(userId, room.currentGame.roundId);

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
}

export default new GameManager();
