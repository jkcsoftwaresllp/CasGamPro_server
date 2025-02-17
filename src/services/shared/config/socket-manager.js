import { GAME_STATES } from "./types.js";
import GameFactory from "./factory.js";
import gameManager from "./manager.js";
import { logger } from "../../../logger/logger.js";
import { pool } from "../../../config/db.js";
import { logGameStateUpdate } from "../helper/logGameStateUpdate.js";

class SocketManager {
  constructor() {
    this.io = null;
    this.namespaces = {
      game: null, // Game state updates
      video: null, // Video streaming
      wallet: null, // Balance updates
      stake: null,
    };
    this.userConnections = new Map(); // userId -> socketId
  }

  initialize(io) {
    this.io = io;
    this.initializeNamespaces();
    this.setupEventHandlers();
  }

  initializeNamespaces() {
    this.namespaces.game = this.io.of("/game");
    this.namespaces.video = this.io.of("/video");
    this.namespaces.wallet = this.io.of("/wallet");
    this.namespaces.stake = this.io.of("/stake");
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

    // stake namespace handlers
    this.namespaces.stake.on("connection", (socket) => {
      this.handleStakeConnection(socket);
    });
  }

  // Game related handlers
  handleGameConnection(socket) {
    socket.on("joinGame", async (data) => {
      try {
        const { userId, gameType } = data;

        console.log("received this shit:", data);

        // Check if user already has an active connection
        if (this.userConnections.has(userId)) {
          const existingSocketId = this.userConnections.get(userId);
          if (this.io.sockets.sockets.has(existingSocketId)) {
            // Disconnect existing connection
            console.log("Disconnecting from older clients for", userId);
            this.io.sockets.sockets.get(existingSocketId).disconnect(true);
          }
        }

        // Store new connection
        this.userConnections.set(userId, socket.id);

        // validating received data
        const result = await gameManager.handleUserJoin(userId, gameType);

        if (result) {
          const { roomId, gameState } = result;

          socket.userId = userId;
          socket.gameType = gameType;

          socket.join(`game:${gameType}`);
          socket.join(`room:${roomId}`);
          socket.join(`user:${userId}`);

          logGameStateUpdate(gameState);
          socket.emit("gameStateUpdate", gameState);
        }
      } catch (error) {
        socket.emit("error", error.message);
      }
    });

    socket.on("disconnect", async () => {
      try {
        const userId = socket.userId;
        if (userId) {
          if (this.userConnections.get(userId) === socket.id) {
            console.info("User disconnected", userId);
            this.userConnections.delete(userId);
            await gameManager.handleUserLeave(userId);
          }
        }
      } catch (error) {
        logger.error("Error on user disconnect:", error);
      }
    });
  }

  notifyGameSwitch(userId, newGameType) {
    if (!this.namespaces.game) return;

    this.namespaces.game.to(`user:${userId}`).emit("gameSwitch", {
      message: `Switched to ${newGameType}`,
      newGameType,
    });
  }

  // Video related handlers
  handleVideoConnection(socket) {
    console.log("New video connection established");

    socket.on("joinVideoStream", (roundId) => {
      console.log(`Client joining video stream for round: ${roundId}`);
      socket.join(`video:${roundId}`);
      socket.roundId = roundId; // Store gameId in socket

      // Send confirmation
      socket.emit("videoStreamJoined", {
        message: `Joined video stream for ${roundId}`,
        timestamp: Date.now(),
      });
    });

    socket.on("leaveVideoStream", (roundId) => {
      console.log(`Client leaving video stream for game: ${roundId}`);
      socket.leave(`video:${roundId}`);
      socket.roundId = null;
    });

    // Add disconnect handler
    socket.on("disconnect", () => {
      console.log("Video client disconnected");
    });
  }

  // Wallet related handlers
  handleWalletConnection(socket) {
    socket.on("joinWallet", async (userId) => {
      try {
        socket.join(`wallet:${userId}`);

        // Get user's balance from database
        const [rows] = await pool.query(
          `SELECT p.balance
             FROM players p
             WHERE p.userId = ?`,
          [userId],
        );

        if (rows.length > 0) {
          socket.emit("walletUpdate", {
            balance: rows[0].balance,
            timestamp: Date.now(),
          });
        } else {
          socket.emit("error", "User balance not found");
        }
      } catch (error) {
        logger.error(`Wallet error for user ${userId}:`, error);
        socket.emit("error", "Failed to fetch wallet balance");
      }
    });
  }

  // stake related handlers
  handleStakeConnection(socket) {
    socket.on("joinStake", ({ userId, roundId }) => {
      if (userId && roundId) {
        socket.roundId = roundId;
        socket.join(`stake:${roundId}:${userId}`);
      }
    });
  }

  // Broadcast methods
  broadcastGameState(gameType, gameState) {
    if (!this.namespaces.game) return;

    logGameStateUpdate(gameState);

    this.namespaces.game
      .to(`game:${gameType}`)
      .emit("gameStateUpdate", gameState);
  }

  broadcastVideoFrame(roundId, frameData) {
    if (!this.namespaces.video) {
      console.log("Video namespace not initialized");
      return;
    }

    console.log(`Broadcasting frame to video:${roundId}`, {
      timestamp: Date.now(),
      dataSize: frameData.frameData?.length || 0,
    });

    this.namespaces.video.to(`video:${roundId}`).emit("videoFrame", {
      roundId,
      timestamp: Date.now(),
      ...frameData,
    });
  }

  broadcastWalletUpdate(userId, balance) {
    if (!this.namespaces.wallet) return;

    this.namespaces.wallet.to(`wallet:${userId}`).emit("walletUpdate", {
      balance,
      timestamp: Date.now(),
    });
  }

  broadcastStakeUpdate(userId, roundId, stakeData) {
    if (!this.namespaces.stake) return;

    this.namespaces.stake.to(`stake:${roundId}:${userId}`).emit("stakeUpdate", {
      ...stakeData,
      timestamp: Date.now(),
    });
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
      throw new Error("couldn't fetch the user balance");
    }
  }
}

export default new SocketManager();
