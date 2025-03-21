import { db } from "../../../config/db.js";
import { game_bets, users, ledger } from "../../../database/schema.js";
import { eq, sql } from "drizzle-orm";
import Decimal from "decimal.js";
import {
  logToFolderError,
  logToFolderInfo,
} from "../../../utils/logToFolder.js";
import gameManager from "../../../services/shared/config/manager.js";
import { validateBetAmount } from "./getBettingRange.js";
import { checkBetBlocking } from "./checkBetBlocking.js";
import SocketManager from "../../../services/shared/config/socket-manager.js";
import { logger } from "../../../logger/logger.js";

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

    const betAmount = new Decimal(amount);

    // Check if the user is blocked from betting
    await checkBetBlocking(userId);

    // Validate bet amount
    const betValidation = await validateBetAmount(userId, betAmount);
    if (!betValidation.data.success) {
      return res.status(400).json({
        uniqueCode: "CGP0139",
        message: "Invalid bet amount, Enter amount within the range",
      });
    }

    // Fetch client & agent details within a transaction to reduce DB calls
    const userWalletBalance = await db.transaction(async (trx) => {
      const user = await trx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length)
        throw {
          status: 404,
          uniqueCode: "CGP0137",
          message: "User not found",
        };

      return user[0].balance;
    });

    const userBalance = new Decimal(userWalletBalance);

    if (userBalance.lessThan(betAmount)) {
      return res.status(400).json({
        uniqueCode: "CGP0140",
        message: "Insufficient balance",
      });
    }

    // Pre-place bet call
    const preBetResult = await gameManager.placeBetPreCall(
      roundId,
      side,
      betAmount
    );

    console.log("UEUE: ", preBetResult);

    if (!preBetResult.data.success) {
      return res.status(400).json(preBetResult);
    }

    // Deduct from client & add to agent within a transaction
    let betResult, updatedBalance;
    await db.transaction(async (trx) => {
      updatedBalance = userBalance.minus(betAmount);

      await trx
        .update(users)
        .set({ balance: updatedBalance.toFixed(2) })
        .where(eq(users.id, userId));

      // Insert bet details
      betResult = await trx.insert(game_bets).values({
        user_id: userId,
        round_id: roundId,
        bet_amount: betAmount.toFixed(2),
        bet_side: side,
      });

      const gameType = preBetResult.data.gameType;

      // const [{ totalAmount }] = await trx
      //   .select({ totalAmount: sql`COALESCE(SUM(credit - debit), 0)` })
      //   .from(ledger)
      //   .where(eq(ledger.user_id, userId));

      // const newAmount = (totalAmount || 0) - betAmount;
      const entry = `Bet placed for ${gameType} (${roundId.slice(
        -4
      )}) on ${side.toUpperCase()}`;

      console.info("PLACE BET WORKING!!! 8 ");

      const ledgerData = {
        user_id: userId,
        round_id: roundId,
        transaction_type: "BET_PLACED",
        entry: entry,
        amount: betAmount,
        debit: betAmount,
        credit: 0,
        previous_balance: userBalance.toFixed(2),
        new_balance: updatedBalance.toFixed(2),
        stake_amount: -betAmount,
        result: "BET_PLACED",
        status: "PENDING",
        description: "BWAHAHHA",
      };

      console.log(ledgerData);

      const query = await trx.insert(ledger).values(ledgerData);
      console.log("Generated Query:", query.toSQL());
    });

    console.info("PLACE BET WORKING!!! 9 ");

    // Update game data
    const game = preBetResult.data.game;

    console.log("UEUE: ", game);

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

    res.json({ success: true, balance: clientBalance.toFixed(2) });
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
