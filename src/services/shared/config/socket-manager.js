import gameManager from "./manager.js";
import { logger } from "../../../logger/logger.js";
import { db } from "../../../config/db.js";
import { logGameStateUpdate } from "../helper/logGameStateUpdate.js";
import { game_bets, users } from "../../../database/schema.js";
import { eq, and } from "drizzle-orm";
import { getBetMultiplier } from "../helper/getBetMultiplier.js";

class SocketManager {
  constructor() {
    this.io = null;
    this.namespaces = {
      game: null, // Game state updates
      video: null, // Video streaming
      wallet: null, // Balance updates
      stake: null,
      liveCasino: null, // Live games for agents
    };

    this.socketConnections = new Map();

    this.frameStats = {
      totalFrames: 0,
      totalSize: 0,
      frameTimes: [],
      lastFrameTime: null,
      dealing: {
        frames: 0,
        totalSize: 0,
        avgInterval: 0,
        lastTime: null,
      },
      nonDealing: {
        frames: 0,
        totalSize: 0,
        avgInterval: 0,
        lastTime: null,
      },
    };
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
    this.namespaces.liveCasino = this.io.of("/liveCasino");
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

    // Live games namespace handlers
    this.namespaces.liveCasino.on("connection", (socket) => {
      handleLiveCasinoSocket(socket, this.namespaces.liveCasino);
    });
  }

  // Game related handlers
  handleGameConnection(socket) {
    socket.on("joinGame", async (data) => {
      try {
        const { userId, gameType } = data;

        // Store both userId and gameType
        socket.userId = userId;
        socket.gameType = gameType;

        // Store socket reference
        this.socketConnections.set(userId, socket);

        /* why are we storing userId and gameType in both socket and this.socketConnections ? */

        socket.join(`game:${gameType}`); // Join room immediately

        const gameState = await gameManager.handleUserJoin(userId, gameType);
        socket.emit("gameStateUpdate", gameState);
      } catch (error) {
        socket.emit("error", error.message);
      }
    });

    socket.on("disconnect", () => {
      const userId = socket.userId;
      if (userId) {
        gameManager.handleUserLeave(userId, socket.gameType);
        this.socketConnections.delete(userId);
      }
    });
  }

  subscribeToGame(userId, gameType) {
    const socket = this.socketConnections.get(userId);
    if (socket) {
      socket.join(`game:${gameType}`);

      // Send current game state
      const gameInstance = gameManager.getGameInstance(gameType);
      if (gameInstance) {
        socket.emit("gameStateUpdate", gameInstance.getGameState());
      }
    }
  }

  // Video related handlers
  handleVideoConnection(socket) {
    // console.log("New video connection established");

    socket.on("joinVideoStream", (roundId) => {
      // console.log(`Client joining video stream for round: ${roundId}`);
      socket.join(`video:${roundId}`);
      socket.roundId = roundId; // Store gameId in socket

      // Send confirmation
      socket.emit("videoStreamJoined", {
        message: `Joined video stream for ${roundId}`,
        timestamp: Date.now(),
      });
    });

    socket.on("leaveVideoStream", (roundId) => {
      // console.log(`Client leaving video stream for game: ${roundId}`);
      socket.leave(`video:${roundId}`);
      socket.roundId = null;
    });

    // Add disconnect handler
    // socket.on("disconnect", () => {
    //   console.log("Video client disconnected");
    // });
  }

  // Wallet related handlers
  handleWalletConnection(socket) {
    socket.on("joinWallet", async (userId) => {
      try {
        socket.join(`wallet:${userId}`);

        // Get user's balance from database
        // TODO : Generaise this
        const rows = await db
          .select({
            balance: users.balance,
          })
          .from(users)
          .where(eq(users.id, userId));

        if (rows.length > 0) {
          socket.emit("walletUpdate", {
            balance: rows[0].balance,
            timestamp: Date.now(),
          });
        } else {
          // Get user's balance from database
          // TODO : Generaise this

          const rows = await db
            .select({
              balance: users.balance,
            })
            .from(users)
            .where(eq(users.id, userId));

          if (rows.length > 0) {
            socket.emit("walletUpdate", {
              balance: rows[0].balance,
              timestamp: Date.now(),
            });
          } else socket.emit("error", "User balance not found");
        }
      } catch (error) {
        logger.error(`Wallet error for user ${userId}:`, error);
        socket.emit("error", "Failed to fetch wallet balance");
      }
    });
  }

  // stake related handlers
  async handleStakeConnection(socket) {
    socket.on("joinStake", async ({ userId, roundId }) => {
      // console.log(`Stake connection request:`, { userId, roundId });
      try {
        if (!userId || !roundId) {
          socket.emit("error", { message: "Invalid user ID or round ID" });
          return;
        }

        const game = gameManager.getGameFromRoundId(roundId);
        if (!game) {
          // console.log(`Game not found for roundId: ${roundId}`);
          socket.emit("error", { message: "Game not found" });
          return;
        }

        const room = `stake:${roundId}:${userId}`;
        socket.roundId = roundId;
        socket.join(room);
        // console.log(`User ${userId} joined stake room: ${room}`);

        // Fetch existing bets for this user and round
        const existingBets = await db
          .select({
            betSide: game_bets.bet_side,
            betAmount: game_bets.bet_amount,
            winAmount: game_bets.win_amount,
            createdAt: game_bets.created_at,
          })
          .from(game_bets)
          .where(
            and(
              eq(game_bets.user_id, userId),
              eq(game_bets.round_id, roundId)
            )
          )
          .orderBy(game_bets.created_at);

        // Format and send existing bets
        const formattedBets = await Promise.all(existingBets.map(async bet => {
          const odd = await getBetMultiplier(game.gameType, bet.betSide);
          const profit = (odd * Number(bet.betAmount)).toFixed(2);
          return {
            name: bet.betSide,
            odd: odd,
            stake: Number(bet.betAmount),
            profit: profit,
            timestamp: bet.createdAt.getTime(),
          };
        }));

        socket.emit("existingStakes", formattedBets);
      } catch (error) {
        logger.error("Error in stake connection:", error);
        socket.emit("error", { message: "Internal server error" });
      }
    });
  }

  // Broadcast methods
  broadcastGameState(gameType, gameState) {
    if (!this.namespaces.game) return;

    logGameStateUpdate(gameState);

    // console.log(`game:${gameType}`)

    this.namespaces.game
      .to(`game:${gameType}`)
      .emit("gameStateUpdate", gameState);
  }

  broadcastVideoFrame(roundId, frameData) {
    // console.log(`Broadcasting frame to video:${roundId}`, {
    //   timestamp: Date.now(),
    //   dataSize: frameData.frameData?.length || 0,
    // });

    const now = Date.now();
    const phase = frameData.phase || "unknown";

    // Calculate frame interval
    if (this.frameStats.lastFrameTime) {
      const interval = now - this.frameStats.lastFrameTime;
      this.frameStats.frameTimes.push(interval);
    }
    this.frameStats.lastFrameTime = now;

    // Update phase-specific stats
    const phaseStats =
      phase === "dealing"
        ? this.frameStats.dealing
        : this.frameStats.nonDealing;
    phaseStats.frames++;
    phaseStats.totalSize += frameData.frameData?.length || 0;

    if (phaseStats.lastTime) {
      const interval = now - phaseStats.lastTime;
      phaseStats.avgInterval =
        (phaseStats.avgInterval * (phaseStats.frames - 1) + interval) /
        phaseStats.frames;
    }
    phaseStats.lastTime = now;

    // Log detailed stats every 100 frames
    if (this.frameStats.totalFrames % 100 === 0) {
      // console.log(`\n=== Frame Statistics ===`);
      // console.log(`Total Frames: ${this.frameStats.totalFrames}`);
      // console.log(`Current Phase: ${phase}`);
      // console.log(`Dealing Frames: ${this.frameStats.dealing.frames}`);
      // console.log(
      //   `Dealing Avg Interval: ${this.frameStats.dealing.avgInterval.toFixed(2)}ms`,
      // );
      // console.log(
      //   `Dealing Avg Size: ${(this.frameStats.dealing.totalSize / this.frameStats.dealing.frames).toFixed(2)} bytes`,
      // );
      // console.log(`Non-Dealing Frames: ${this.frameStats.nonDealing.frames}`);
      // console.log(
      //   `Non-Dealing Avg Interval: ${this.frameStats.nonDealing.avgInterval.toFixed(2)}ms`,
      // );
      // console.log(
      //   `Non-Dealing Avg Size: ${(this.frameStats.nonDealing.totalSize / this.frameStats.nonDealing.frames).toFixed(2)} bytes`,
      // );

      // Calculate frame time percentiles
      const sortedTimes = [...this.frameStats.frameTimes].sort((a, b) => a - b);
      const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
      const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

      // console.log(`Frame Intervals (ms):`);
      // console.log(`  p50: ${p50}`);
      // console.log(`  p95: ${p95}`);
      // console.log(`  p99: ${p99}`);
      // console.log(`=====================\n`);
    }

    // Existing broadcast code
    if (!this.namespaces.video) {
      console.log("Video namespace not initialized");
      return;
    }

    // const start = performance.now();

    this.namespaces.video.to(`video:${roundId}`).emit("videoFrame", {
      roundId,
      timestamp: now,
      ...frameData,
    });

    // const end = performance.now();
    // console.log(`Frame broadcast took ${(end - start).toFixed(2)}ms`);

    this.frameStats.totalFrames++;
  }

  broadcastWalletUpdate(userId, balance) {
    if (!this.namespaces.wallet) return;

    this.namespaces.wallet.to(`wallet:${userId}`).emit("walletUpdate", {
      balance,
      timestamp: Date.now(),
    });
  }

  broadcastStakeUpdate(userId, roundId, stakeData) {
    if (!this.namespaces.stake) {
      console.log("Stake namespace not initialized");
      return;
    }

    // Format the stake data to match client expectations
    const formattedStakeData = {
      name: stakeData.side, // Client expects 'name' instead of 'side'
      odd: stakeData.odd, // Keep as is
      stake: stakeData.stake, // Keep as is
      profit: stakeData.amount, // Client expects 'profit' instead of 'amount'
      timestamp: Date.now(),
    };

    const room = `stake:${roundId}:${userId}`;
    this.namespaces.stake.to(room).emit("stakeUpdate", formattedStakeData);
  }

  // Live games broadcast method
  broadcastLiveCasinoUpdate(roundId) {
    if (!this.namespaces.liveCasino) return;
    broadcastLiveCasinoUpdate(this.namespaces.liveCasino, roundId);
  }

  // Utility methods
  async fetchUserBalance(userId) {
    try {
      if (!userId) throw new Error("User ID is required");

      socket.join(`wallet:${userId}`);
      const playerData = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

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
