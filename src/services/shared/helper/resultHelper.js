import { getBetMultiplier } from "./getBetMultiplier.js";
import { db, pool } from "../../../config/db.js";
import { bets, game_bets, ledger } from "../../../database/schema.js";
import { eq } from "drizzle-orm";
import { GAME_TYPES } from "../config/types.js";
import SocketManager from "../config/socket-manager.js";
import { formatDate } from "../../../utils/formatDate.js";

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
      GAME_TYPES.LUCKY7A,
      GAME_TYPES.DRAGON_TIGER,
      GAME_TYPES.DRAGON_TIGER_TWO,
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
        const balanceRow = await db
          .select({
            playerId: users.id.as('playerId'),
            balance: users.balance,
            agentId: users.id,
            agentBalance: users.balance.as('agentBalance'),
          })
          .from(users)
          .where(users.id.eq(userId))
          .execute();

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
            await db
             .update(game_bets)
             .set({
               winAmount: true,
             })
             .where(
               game_bets.round_id.eq(this.roundId),
               game_bets.user_id.eq(playerId),
               game_bets.bet_side.eq(side),
             )
             .execute();
          }
        }

        // If user won anything, update their balance
        if (totalWinAmount > 0) {
          // Round the final balance to 2 decimal places
          const newPlayerBalance =
            Math.round((parseFloat(playerBalance) + totalWinAmount) * 100) /
            100;
          // const newAgentBalance =
          //   Math.round((parseFloat(agentBalance) - totalWinAmount) * 100) / 100; TODO: AGENT wallet will update only twice not this time

          // Ensure balance updates are valid numbers
          if (!isNaN(newPlayerBalance)) {
            await db
              .update(users)
              .set({
                balance: newPlayerBalance,
              })
              .where(users.id.eq(userId))
              .execute();
          }

          // if (!isNaN(newAgentBalance)) {
          //   await connection.query(
          //     `UPDATE agents SET balance = ? WHERE id = ?`,
          //     [newAgentBalance, agentId]
          //   );
          // }

          winners.set(userId, {
            oldBalance: playerBalance,
            newBalance: newPlayerBalance,
            totalWinAmount,
            winningBets,
          });

          const entry = `Winnings for game ${
            this.gameType
          } (${this.roundId.slice(-4)})`;

          // Get the total amount in ledger for the user (credit - debit)
          const [{ totalAmount }] = await db
            .select({
              totalAmount: db.coalesce(db.sum(ledger.credit.minus(ledger.debit)), 0)
            })
            .from(ledger)
            .where(ledger.userId.eq(userId))
            .execute();

          // Ensure `totalAmount` and `totalWinAmount` are numeric
          const numericTotalAmount = parseFloat(totalAmount) || 0;
          const numericTotalWinAmount = parseFloat(totalWinAmount) || 0;
          // Calculate the new updated amount (Ensure it's a valid decimal number)
          const newAmount = (
            numericTotalAmount + numericTotalWinAmount
          ).toFixed(2); // Ensure proper decimal format

          const dateForLedger = new Date();

          // Insert ledger entry for winnings
          await db
           .insert(ledger)
           .values({
            userId: userId,
            date: dateForLedger,
            entry: entry,
            debit: 0,
            credit: totalWinAmount,
            balance: newPlayerBalance,
            roundId: this.roundId,
            status: "PAID",
            results: "WIN",
            stakeAmount: totalWinAmount,
            amount: newAmount
           })
           .execute();

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
