import GameFactory from "./factory.js";
import { GAME_CONFIGS } from "./types.js";
import redis from "../../../config/redis.js";
import { logger } from "../../../logger/logger.js";

class GameManager {
  constructor() {
    this.activeGames = new Map(); // gameId -> gameInstance
    this.gameRooms = new Map(); // roomId -> {gameType, games[], clientCount}
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
      const gameInstance = GameFactory.deployGame(
        gameType,
        roundId,
        room.id,
      );

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
}

export default new GameManager();
