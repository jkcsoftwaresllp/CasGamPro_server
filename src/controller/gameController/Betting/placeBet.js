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

    // Check if the user is blocked from betting
    await checkBetBlocking(userId);

    // Validate bet amount
    const betValidation = await validateBetAmount(userId, amount);
    if (!betValidation.data.success) {
      return res.status(400).json({
        uniqueCode: "CGP0139",
        message: "Invalid bet amount, Enter amount within the range",
      });
    }

    // Fetch client & agent details within a transaction to reduce DB calls
    const userData = await db.transaction(async (trx) => {
      const user = await trx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!client.length)
        throw {
          status: 404,
          uniqueCode: "CGP0137",
          message: "User not found",
        };

      return { user: user[0] };
    });

    let userBalance = new Decimal(userData[0].balance);
    // let agentId = clientData.agent.id;

    if (userBalance.lessThan(amount)) {
      return res.status(400).json({
        uniqueCode: "CGP0140",
        message: "Insufficient balance",
      });
    }

    // Pre-place bet call
    const preBetResult = await gameManager.placeBetPreCall(
      roundId,
      side,
      amount
    );
    if (!preBetResult.data.success) {
      return res.status(400).json(preBetResult);
    }

    // Deduct from client & add to agent within a transaction
    let betResult;
    await db.transaction(async (trx) => {
      userBalance = userBalance.minus(amount);

      await trx
        .update(users)
        .set({ balance: userBalance.toFixed(2) })
        .where(eq(users.id, userId));

      // Insert bet details
      betResult = await trx.insert(game_bets).values({
        user_id: userId,
        round_id: roundId,
        bet_amount: new Decimal(amount).toFixed(2),
        bet_side: side,
        status: "PENDING",
      });

      const gameType = preBetResult.data.gameType;

      const [{ totalAmount }] = await trx
        .select({ totalAmount: sql`COALESCE(SUM(credit - debit), 0)` })
        .from(ledger)
        .where(eq(ledger.user_id, userId));

      const newAmount = (totalAmount || 0) - amount;
      const entry = `Bet placed for ${gameType} (${roundId.slice(
        -4
      )}) on ${side.toUpperCase()}`;

      // Insert ledger entry
      await trx.insert(ledger).values({
        user_id: userId,
        date: new Date(),
        entry: entry,
        debit: amount,
        credit: 0,
        previous_balance: userBalance.plus(amount).toFixed(2),
        new_balance: userBalance.toFixed(2),
        round_id: roundId,
        status: "PENDING",
        result: "BET_PLACED",
        stake_amount: -amount,
        amount: newAmount,
      });
    });

    // Update game data
    const game = preBetResult.data.game;
    const userBets = game.game_bets.get(userId) || [];
    const stakeUpdate = {
      side,
      stake: amount,
      odd: preBetResult.data.odd,
      amount: preBetResult.data.amountAfterMultiplier,
      timestamp: Date.now(),
    };

    userBets.push(stakeUpdate);
    game.game_bets.set(userId, userBets);

    // Broadcast updates
    SocketManager.broadcastWalletUpdate(userId, userBalance.toFixed(2));
    // SocketManager.broadcastWalletUpdate(agentId, agentBalance.toFixed(2)); // TODO : if we uncomment this then wallet balance will increase instead of decrease
    SocketManager.broadcastStakeUpdate(userId, roundId, stakeUpdate);

    // Log success
    logToFolderInfo("Agent/controller", "placeBet", {
      uniqueCode: "CGP0141",
      message: `Bet placed successfully for player ${userId}`,
      data: { success: true },
    });

    res.json({ success: true, balance: clientBalance.toFixed(2) });
  } catch (error) {
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
