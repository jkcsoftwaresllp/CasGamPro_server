import { eq } from "drizzle-orm";
import Decimal from "decimal.js";
import { db } from "../../../config/db.js"; // Drizzle ORM Database Instance
import {
  logToFolderError,
  logToFolderInfo,
} from "../../../utils/logToFolder.js";
import gameManager from "../../../services/shared/config/manager.js";
import { validateBetAmount } from "./getBettingRange.js";
import { checkBetBlocking } from "./checkBetBlocking.js";
import SocketManager from "../../../services/shared/config/socket-manager.js";
import { logger } from "../../../logger/logger.js";
import { createLedgerEntry } from "../../../database/queries/panels/createLedgerEntry.js";
import { users, game_bets } from "../../../database/schema.js";
import { updateDBUserColumns } from "../../../database/queries/panels/updateDBUserColumn.js";

export const placeBet = async (req, res) => {
  try {
    const { roundId, amount, side } = req.body;
    const userId = req.session.userId;

    if (!roundId || !amount || !side) {
      return res.status(400).json({
        uniqueCode: "CGP0143",
        message: "Missing required fields",
      });
    }

    const betAmount = parseFloat(amount);

    // Check if user is blocked from betting
    await checkBetBlocking(userId);

    // Validate bet amount
    const betValidation = await validateBetAmount(userId, betAmount);
    if (!betValidation.data.success) {
      return res.status(400).json({
        uniqueCode: "CGP0139",
        message: "Invalid bet amount, Enter amount within the range",
      });
    }

    // Execute transaction using Drizzle
    await db.transaction(async (tx) => {
      // Fetch user balance
      const [user] = await tx
        .select({
          balance: users.balance,
          coins: users.coins,
          exposure: users.exposure,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        throw {
          status: 404,
          uniqueCode: "CGP0137",
          message: "User not found",
        };
      }

      const userBalance = parseFloat(user.balance);
      const userCoins = parseFloat(user.coins);
      const userExposure = parseFloat(user.exposure);

      if (userBalance < betAmount) {
        throw {
          status: 400,
          uniqueCode: "CGP0140",
          message: "Insufficient balance",
        };
      }

      // Pre-place bet call
      const preBetResult = await gameManager.placeBetPreCall(
        roundId,
        side,
        betAmount
      );

      if (!preBetResult.data.success) {
        throw {
          status: 400,
          message: preBetResult.message || "Bet placement failed",
        };
      }

      // Deduct from user's balance
      const updatedBalance = userBalance - betAmount;
      const updatedCoins = userCoins - betAmount;
      const updatedExposure = userExposure - betAmount;

      await tx
        .update(users)
        .set({
          balance: updatedBalance,
          coins: updatedCoins,
          exposure: updatedExposure,
        })
        .where(eq(users.id, userId));

      // Insert bet details into `game_bets` table
      await tx.insert(game_bets).values({
        user_id: userId,
        round_id: roundId,
        bet_amount: betAmount.toFixed(2),
        bet_side: side,
      });

      const gameType = preBetResult.data.gameType;
      const entry = `Bet placed for ${gameType} (${roundId.slice(
        -4
      )}) on ${side.toUpperCase()}`;

      // Ledger entry for wallet, exposure, and coins
      await createLedgerEntry({
        userId: userId,
        amount: (-betAmount).toFixed(2),
        type: "BET_PLACED",
        roundId,
        entry,
        balanceType: ["wallet", "exposure", "coins"],
        tx, // Pass transaction
      });

      // Update game data
      const game = preBetResult.data.game;
      const userBets = game.bets.get(userId) || [];
      const stakeUpdate = {
        side,
        stake: betAmount,
        odd: preBetResult.data.odd,
        amount: preBetResult.data.amountAfterMultiplier,
        timestamp: Date.now(),
      };

      userBets.push(stakeUpdate);
      game.bets.set(userId, userBets);

      // Broadcast updates
      SocketManager.broadcastWalletUpdate(userId, updatedBalance.toFixed(2));
      SocketManager.broadcastStakeUpdate(userId, roundId, stakeUpdate);

      // Log success
      logToFolderInfo("Agent/controller", "placeBet", {
        uniqueCode: "CGP0141",
        message: `Bet placed successfully for player ${userId}`,
        data: { success: true },
      });

      res.json({ success: true, balance: updatedBalance.toFixed(2) });
    });
  } catch (error) {
    logger.error("Error in Placing Bet: ", error);

    const statusCode = error.status || 400;
    const errorCode = error.uniqueCode || "CGP0142";

    logToFolderError("Agent/controller", "placeBet", {
      uniqueCode: errorCode,
      message: error.message || "Unexpected error",
      data: error.data || { success: false },
    });

    res.status(statusCode).json({
      uniqueCode: errorCode,
      message: error.message || "An unexpected error occurred",
    });
  }
};
