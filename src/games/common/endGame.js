import { GAME_STATES, GAME_TYPES } from "../../services/shared/config/types.js";
import gameManager from "../../services/shared/config/manager.js";
import { logger } from "../../logger/logger.js";
import { db } from "../../config/db.js";
import { ledgerEntries } from "../../database/schema.js";

export async function endGame(gameType, gameInstance) {
  gameInstance.status = GAME_STATES.COMPLETED;

  // Common operations for games
  await gameInstance.storeGameResult();

  // TODO - Add ledger database entry
  // Ledger database entry
  const result = gameInstance.getResult(); // Method to get game results (win/loss)
  const userId = gameInstance.userId;
  const amount = gameInstance.stakeAmount; // Coins staked by the user
  const winnings = result === "Win" ? gameInstance.calculateWinnings() : 0;
  const balance = await gameInstance.updateBalance(userId, winnings); // Update user balance in your system

  try {
    const newLedgerEntry = {
      userId,
      gameId: gameInstance.gameId,
      roundId: gameInstance.roundId,
      date: new Date(),
      entry: result === "Win" ? "Win" : "Loss",
      amount,
      debit: result === "Win" ? 0 : amount,
      credit: winnings,
      balance,
      status: result,
    };
    await db.insert(ledgerEntries).values(newLedgerEntry);
    logger.info(
      `Ledger entry added for user ${userId}, game ${gameInstance.gameId}`
    );
    // TODO - update UI with latest ledger entry

    io.to(userId).emit("ledger-update", {
      transaction: {
        ...newLedgerEntry,
        date: newLedgerEntry.date.toISOString(), // Format date for client
      },
    });
  } catch (error) {
    logger.error("Failed to add ledger entry:", error);
  }

  // TODO - update result of the game history
  try {
    const gameHistory = await gameInstance.getGameHistory(userId); // Fetch updated game history
    io.to(userId).emit("game-history-update", { history: gameHistory });
    logger.info(`Game history updated for user ${userId}`);
  } catch (error) {
    logger.error("Failed to update game history:", error);
  }

  // Andar Bahar
  if (gameType === "AndarBahar") {
    gameInstance.logSpecificGameState();
  } else if (gameType === "Lucky7B") {
    await gameInstance.saveState();
    gameInstance.logGameState("Game Completed");

    // Lucky 7B
    setTimeout(async () => {
      try {
        await gameInstance.clearState();
        const newGame = await gameManager.startNewGame(GAME_TYPES.LUCKY7B);
        gameManager.activeGames.delete(gameInstance.gameId);
        await newGame.start();
      } catch (error) {
        logger.error("Failed to start new game:", error);
      }
    }, 5000);
  } else if (gameType === "TeenPatti") {
    setTimeout(async () => {
      try {
        await gameInstance.clearState();
        const newGame = await gameManager.startNewGame(GAME_TYPES.TEEN_PATTI);
        gameManager.activeGames.delete(gameInstance.gameId);
        await newGame.start();
      } catch (error) {
        logger.error("Failed to start new game:", error);
      }
    }, 5000);
  }else if (gameType === "DragonTiger") {
    setTimeout(async () => {
      try {
        await gameInstance.clearState();
        const newGame = await gameManager.startNewGame(GAME_TYPES.DRAGON_TIGER);
        gameManager.activeGames.delete(gameInstance.gameId);
        await newGame.start();
      } catch (error) {
        logger.error("Failed to start new game:", error);
      }
    }, 5000);
  }
}
