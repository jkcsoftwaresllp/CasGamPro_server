import { getBetMultiplier } from "./getBetMultiplier.js";
import { db, pool } from "../../../config/db.js";
import { bets } from "../../../database/schema.js";
import { eq } from "drizzle-orm";
import { GAME_TYPES } from "../config/types.js";
import SocketManager from "../config/socket-manager.js";
import { recordBetResult } from "../../../controller/clientLedgerController.js";
import { createTransactionEntry } from "../../../controller/agentLedgerController.js";

export const aggregateBets = async (roundId) => {
  try {
    // Fetch all bets for the given roundId
    const betData = await db
      .select()
      .from(bets)
      .where(eq(bets.roundId, roundId));

    console.log("Round ID", roundId);

    // Aggregate the sum manually using JavaScript
    const summary = betData.reduce((acc, bet) => {
      acc[bet.betSide] = (acc[bet.betSide] || 0) + bet.betAmount;
      return acc;
    }, {});

    console.log("Bet Data:", betData);
    console.log("Bet summary:", summary);

    // // Convert the object to an array format
    // return Object.entries(summary).map(([betOption, totalBetAmount]) => ({
    //   betOption,
    //   totalBetAmount,
    // }));
    return summary;
  } catch (error) {
    console.error("Error fetching bet summary:", error);
    throw error;
  }
};

const LEDGER_STATUS = {
  PAID: "PAID",
  PENDING: "PENDING",
};

const RESULT_STATUS = {
  WIN: "WIN",
  TIE: "TIE",
  LOSE: "LOSE",
  BET_PLACED: "BET_PLACED",
};

export async function distributeWinnings() {
  console.log("bets: ", this.bets);

  try {
    const winners = new Map();
    const isMultiWinnerGame = [
      GAME_TYPES.LUCKY7B,
      GAME_TYPES.DRAGON_TIGER,
    ].includes(this.gameType);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Calculate winnings for each user's bets
      for (const [userId, userBets] of this.bets) {
        console.log(`Processing bets for user ${userId}:`, userBets);
        let totalWinAmount = 0;
        let winningBets = [];

        // Get current balance from database
        const [balanceRow] = await connection.query(
          `SELECT p.id, p.balance
           FROM players p
           WHERE p.userId = ?`,
          [userId]
        );

        if (!balanceRow.length) {
          console.error(`No player found for userId: ${userId}`);
          continue;
        }

        const playerId = balanceRow[0].id;
        const currentBalance = parseFloat(balanceRow[0].balance);

        // Process each bet for the user
        for (const bet of userBets) {
          const { side, stake } = bet;
          let winAmount = 0;

          console.log(`Checking bet:`, {
            side,
            stake,
            winner: this.winner,
            isMatch: side === this.winner,
          });

          if (isMultiWinnerGame) {
            const multiplier = await getBetMultiplier(this.gameType, side);
            if (this.winner.includes(side)) {
              winAmount = parseFloat(stake) * parseFloat(multiplier);
            }
          } else {
            if (side === this.winner) {
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
          const newBalance =
            Math.round((currentBalance + totalWinAmount) * 100) / 100;

          console.log("Balance calculation:", {
            currentBalance,
            totalWinAmount,
            newBalance,
          });

          // Update player balance in database
          await connection.query(
            `UPDATE players
             SET balance = ?
             WHERE id = ?`,
            [newBalance, playerId]
          );

          // Record in ledger
          // await connection.query(
          //   `INSERT INTO ledger (
          //     userId,
          //     roundId,
          //     date,
          //     entry,
          //     amount,
          //     credit,
          //     balance,
          //     status,
          //     stakeAmount,
          //     result
          //   ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)`,
          //   [
          //     userId,
          //     this.roundId,
          //     `Win from ${this.gameType}`,
          //     totalWinAmount,
          //     totalWinAmount,
          //     newBalance,
          //     LEDGER_STATUS.PAID,
          //     totalWinAmount,
          //     RESULT_STATUS.WIN,
          //   ],
          // );
          
          // Record in ledger
          await recordBetResult(userId, this.roundId, true, totalWinAmount);

          winners.set(userId, {
            oldBalance: currentBalance,
            newBalance,
            totalWinAmount,
            winningBets,
          });

          console.log("Congrats! a profit was made:", newBalance);

          // Broadcast wallet update
          SocketManager.broadcastWalletUpdate(userId, newBalance);
        } else {
          // Record loss in ledger
          await recordBetResult(userId, this.roundId, false, 0);
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

      // Create agent transaction entry
      await createTransactionEntry({
        agentId: this.agentId,
        entry: `Game ended for round ${this.roundId}`,
        betsAmount: this.totalBetsAmount,
        profitAmount: this.totalProfitAmount,
        lossAmount: this.totalLossAmount,
        agentProfitShare: this.agentProfitShare,
        agentCommission: this.agentCommission,
        balance: this.agentBalance,
        note: `Game ended for round ${this.roundId}`,
      });
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

// export async function aggregateBets(roundId) {
//   return {};
//   // change this to be sql implementation

//   const bets = await redis.hgetall(`bets:${roundId}`);
//   const totals = {};

//   Object.values(bets).forEach((betData) => {
//     const bet = JSON.parse(betData);
//     totals[bet.side] = (totals[bet.side] || 0) + parseFloat(bet.amount);
//   });

//   return totals;
// }
