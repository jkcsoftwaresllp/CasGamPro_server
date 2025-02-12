import { GAME_STATES } from "./types.js";
import GameFactory from "./factory.js";
import gameManager from "./manager.js";
import { logger } from "../../../logger/logger.js";

class SocketManager {
  constructor() {
    this.io = null;
    this.namespaces = {
      game: null, // Game state updates
      video: null, // Video streaming
      wallet: null, // Balance updates
      chat: null, // Future chat feature
    };
  }

  initialize(io) {
    this.io = io;
    this.initializeNamespaces();
    this.setupEventHandlers();
  }

  initializeNamespaces() {
    // Initialize all namespaces
    this.namespaces.game = this.io.of("/game");
    this.namespaces.video = this.io.of("/video");
    this.namespaces.wallet = this.io.of("/wallet");
    this.namespaces.chat = this.io.of("/chat");
  }

  setupEventHandlers() {
    // Game namespace handlers
    this.namespaces.game.on("connection", (socket) => {
      this.handleGameConnection(socket);
    });

    // Video namespace handlers
    this.namespaces.video.on("connection", (socket) => {
      this.handleVideoConnection(socket);
    });

    // Wallet namespace handlers
    this.namespaces.wallet.on("connection", (socket) => {
      this.handleWalletConnection(socket);
    });

    // Chat namespace handlers (future)
    this.namespaces.chat.on("connection", (socket) => {
      this.handleChatConnection(socket);
    });
  }

  // Game related handlers
  handleGameConnection(socket) {
    socket.on("joinGameType", (gameType) => {
      this.handleJoinGameType(socket, gameType);
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected from game namespace");
    });
  }

  handleJoinGameType(socket, gameType) {
    socket.join(`game:${gameType}`);
    const currentGame = gameManager
      .getActiveGames()
      .find((game) => game.gameType === gameType);

    if (!currentGame) {
      socket.emit("error", "Invalid game type");
      return;
    }

    socket.emit("gameStateUpdate", currentGame.getGameState());
  }

  // Video related handlers
  handleVideoConnection(socket) {
    socket.on("joinVideoStream", (gameId) => {
      socket.join(`video:${gameId}`);
    });

    socket.on("leaveVideoStream", (gameId) => {
      socket.leave(`video:${gameId}`);
    });
  }

  // Wallet related handlers
  handleWalletConnection(socket) {
    socket.on("joinWallet", async (userId) => {
      try {
        socket.join(`wallet:${userId}`);
        const balance = await this.fetchUserBalance(userId);
        socket.emit("balanceUpdate", { balance, timestamp: Date.now() });
      } catch (error) {
        socket.emit("error", "Failed to join wallet");
      }
    });
  }

  // Chat related handlers (future)
  handleChatConnection(socket) {
    socket.on("joinRoom", (roomId) => {
      socket.join(`chat:${roomId}`);
    });

    socket.on("message", (data) => {
      this.broadcastChatMessage(data);
    });
  }

  // Broadcast methods
  broadcastGameState(gameType, gameState) {
    if (!this.namespaces.game) return;
    console.log(gameState);
    this.namespaces.game
      .to(`game:${gameType}`)
      .emit("gameStateUpdate", gameState);
  }

  broadcastVideoFrame(gameId, frameData) {
    if (!this.namespaces.video) return;
    this.namespaces.video.to(`video:${gameId}`).emit("videoFrame", frameData);
  }

  broadcastWalletUpdate(userId, balance) {
    if (!this.namespaces.wallet) return;
    this.namespaces.wallet.to(`wallet:${userId}`).emit("balanceUpdate", {
      balance,
      timestamp: Date.now(),
    });
  }

  broadcastChatMessage(data) {
    if (!this.namespaces.chat) return;
    this.namespaces.chat.to(`chat:${data.roomId}`).emit("message", data);
  }

  // Utility methods
  async fetchUserBalance(userId) {
    try {
      if (!userId) throw new Error("User ID is required");

      socket.join(`wallet:${userId}`);
      const playerData = await db
        .select()
        .from(players)
        .where(eq(players.userId, userId));

      if (playerData.length > 0) {
        socket.emit("walletUpdate", {
          balance: playerData[0].balance,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      throw new Error('couldn\'t fetch the user balance')
    }
  }
}

export default new SocketManager();
