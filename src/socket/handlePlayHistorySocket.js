import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { ledgerEntries } from "../database/schema.js";
import { logger } from "../logger/logger.js";
import Redis from "ioredis";

const redisClient = new Redis(); // Redis client for caching

export const handlePlayHistorySocket = (
  io,
  socket,
  { action, message, playerId, gameType, stake, gameInstance }
) => {
  if (action === "bet-placed") {
    handleBetPlacement(socket, playerId, gameType, stake, gameInstance);
  } else if (action === "game-result") {
    handleGameResult(socket, playerId, gameInstance);
  }
};

async function handleBetPlacement(
  socket,
  playerId,
  gameType,
  stake,
  gameInstance
) {
  try {
    const userId = playerId;
    const roundId = gameInstance.roundId;
    const result = "Bet Placed";

    // Handle Redis cache and update the play history in the database
    const cacheKey = `playHistory:${userId}:${gameType}:${roundId}`;
    const existingEntry = await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.userId, userId))
      .and(eq(ledgerEntries.gameName, gameType))
      .and(eq(ledgerEntries.roundId, roundId))
      .and(eq(ledgerEntries.result, "Bet Placed"))
      .limit(1);

    if (existingEntry.length > 0) {
      await db
        .update(ledgerEntries)
        .set({ stake: existingEntry[0].stake + stake })
        .where(eq(ledgerEntries.id, existingEntry[0].id));
    } else {
      await db.insert(ledgerEntries).values({
        userId,
        gameName: gameType,
        roundId,
        stake,
        result,
        balance: gameInstance.players[0].balance,
        oldBalance: gameInstance.players[0].oldBalance,
        date: new Date(),
      });
    }

    // Update Redis cache
    await redisClient.setex(
      cacheKey,
      60,
      JSON.stringify({
        message: `Bet placed for ${gameType}`,
        stake,
        playerId,
      })
    );

    socket.emit("play-history-created", { playerId, message });
    io.to(userId).emit("play-history-updated", { playerId, message });
  } catch (error) {
    logger.error("Error processing bet placement:", error);
  }
}

async function handleGameResult(socket, playerId, gameInstance) {
  try {
    const result = gameInstance.result === "win" ? "Win" : "Loss";
    const credit = gameInstance.result === "win" ? gameInstance.winnings : 0;

    const userId = playerId;
    const roundId = gameInstance.roundId;

    // Fetch the play history entry for this user and game
    const existingEntry = await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.userId, userId))
      .and(eq(ledgerEntries.gameName, gameInstance.gameType))
      .and(eq(ledgerEntries.roundId, roundId))
      .and(eq(ledgerEntries.result, "Bet Placed"))
      .limit(1);

    if (existingEntry.length > 0) {
      await db
        .update(ledgerEntries)
        .set({
          result,
          balance: existingEntry[0].balance + credit, // Update balance after win/loss
          credit,
          date: new Date(),
        })
        .where(eq(ledgerEntries.id, existingEntry[0].id));
    }

    socket.emit("play-history-result", { playerId, result, credit });
    io.to(userId).emit("play-history-updated", { playerId, result, credit });
  } catch (error) {
    logger.error("Error processing game result:", error);
  }
}
