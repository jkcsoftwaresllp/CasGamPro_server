import { getBetMultiplier } from "./getBetMultiplier.js";
import { db, pool } from "../../../config/db.js";
import { bets, players, agents } from "../../../database/schema.js";
import { eq } from "drizzle-orm";
import { GAME_TYPES } from "../config/types.js";
import SocketManager from "../config/socket-manager.js";

export const aggregateBets = async (roundId) => {
  try {
    // Fetch all bets for the given roundId
    const betData = await db
      .select()
      .from(bets)
      .where(eq(bets.roundId, roundId));

    // Aggregate the sum manually using JavaScript
    const summary = betData.reduce((acc, bet) => {
      acc[bet.betSide] = (acc[bet.betSide] || 0) + bet.betAmount;
      return acc;
    }, {});

    return summary;
  } catch (error) {
    console.error("Error fetching bet summary:", error);
    throw error;
  }
};

export async function distributeWinnings() {
  // console.log("bets: ", this.bets);

  try {
    const winners = new Map();
    const isMultiWinnerGame = [
      GAME_TYPES.LUCKY7B,
      GAME_TYPES.DRAGON_TIGER,
      GAME_TYPES.DRAGON_TIGER_LION,
      GAME_TYPES.ANDAR_BAHAR,
    ].includes(this.gameType);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Calculate winnings for each user's bets
      for (const [userId, userBets] of this.bets) {
        // console.log(`Processing bets for user ${userId}:`, userBets);
        let totalWinAmount = 0;
        let winningBets = [];

        // Get current balance from database
        const [balanceRow] = await connection.query(
          `SELECT p.id AS playerId, p.balance, p.agentId, a.balance AS agentBalance
           FROM players p
           JOIN agents a ON p.agentId = a.id
           WHERE p.userId = ?`,
          [userId]
        );

        if (!balanceRow.length) {
          console.error(`No player found for userId: ${userId}`);
          continue;
        }

        const {
          playerId,
          balance: playerBalance,
          agentId,
          agentBalance,
        } = balanceRow[0];
        //const currentBalance = parseFloat(balanceRow[0].balance);

        // Process each bet for the user
        for (const bet of userBets) {
          const { side, stake } = bet;
          let winAmount = 0;

          // console.log(`Checking bet:`, {
          //   side,
          //   stake,
          //   winner: this.winner,
          //   isMatch: this.winner.includes(side),
          // });

          if (isMultiWinnerGame) {
            const multiplier = await getBetMultiplier(this.gameType, side);
            if (this.winner.includes(side)) {
              winAmount = parseFloat(stake) * parseFloat(multiplier);
            }
          } else {
            if (this.winner.includes(side)) {
              const multiplier = await getBetMultiplier(this.gameType, side);
              winAmount = parseFloat(stake) * parseFloat(multiplier);
            }
          }

          // Round to 2 decimal places to avoid floating point issues
          winAmount = Math.round(winAmount * 100) / 100;

          if (winAmount > 0) {
            totalWinAmount += winAmount;
            winningBets.push({ ...bet, winAmount });

            // Update bet record to mark as win
            await connection.query(
              `UPDATE bets
               SET win = TRUE
               WHERE roundId = ? AND playerId = ? AND betSide = ?`,
              [this.roundId, playerId, side]
            );
          }
        }

        // If user won anything, update their balance
        if (totalWinAmount > 0) {
          // Round the final balance to 2 decimal places
          const newPlayerBalance =
            Math.round((playerBalance + totalWinAmount) * 100) / 100;

          //Agent wallet
          const newAgentBalance =
            Math.round((agentBalance - totalWinAmount) * 100) / 100;

          // console.log("Balance calculation:", {
          //   currentBalance,
          //   totalWinAmount,
          //   newBalance,
          // });

          // Update player balance in database
          await connection.query(
            `UPDATE players
             SET balance = ?
             WHERE id = ?`,
            [newPlayerBalance, playerId]
          );
          // Update agent's balance
          await connection.query(
            `UPDATE agents
             SET balance = ?
             WHERE id = ?`,
            [newAgentBalance, agentId]
          );

          winners.set(userId, {
            oldBalance: playerBalance,
            newBalance: newPlayerBalance,
            totalWinAmount,
            winningBets,
          });

          // console.log("Congrats! a profit was made:", newBalance);

          // Broadcast wallet update
          SocketManager.broadcastWalletUpdate(userId, newPlayerBalance);
        }
      }

      await connection.commit();

      // // Log winning distribution
      // console.info(`Round ${this.roundId} winning distribution:`, {
      //   gameType: this.gameType,
      //   winner: this.winner,
      //   totalWinners: winners.size,
      //   winningDetails: Array.from(winners.entries()),
      // });

      // Clear the betting maps for next round
      this.bets.clear();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(
      `Error distributing winnings for round ${this.roundId}:`,
      error
    );
    throw error;
  }
}
