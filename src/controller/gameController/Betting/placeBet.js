import { pool } from "../../../config/db.js"; // Use pool instead of Drizzle
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
  const connection = await pool.getConnection(); // Get DB connection
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

    // Start MySQL transaction
    await connection.beginTransaction();

    // Fetch user balance
    const [user] = await connection.query(
      `SELECT balance FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (user.length === 0) {
      throw {
        status: 404,
        uniqueCode: "CGP0137",
        message: "User not found",
      };
    }

    const userBalance = new Decimal(user[0].balance);

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

    if (!preBetResult.data.success) {
      return res.status(400).json(preBetResult);
    }

    // Deduct from user's balance
    const updatedBalance = userBalance.minus(betAmount);

    await connection.query(`UPDATE users SET balance = ? WHERE id = ?`, [
      updatedBalance.toFixed(2),
      userId,
    ]);

    // Insert bet details
    await connection.query(
      `INSERT INTO game_bets (user_id, round_id, bet_amount, bet_side) VALUES (?, ?, ?, ?)`,
      [userId, roundId, betAmount.toFixed(2), side]
    );

    const gameType = preBetResult.data.gameType;
    const entry = `Bet placed for ${gameType} (${roundId.slice(
      -4
    )}) on ${side.toUpperCase()}`;

    // Insert ledger entry
    const ledgerData = {
      user_id: userId,
      round_id: roundId,
      transaction_type: "BET_PLACED",
      entry: entry,
      amount: betAmount.toFixed(2),
      debit: betAmount.toFixed(2),
      credit: 0,
      previous_balance: userBalance.toFixed(2),
      new_balance: updatedBalance.toFixed(2),
      stake_amount: -betAmount.toFixed(2),
      results: "BET_PLACED",
      status: "PENDING",
      description: "BWAHAHHA",
    };

    await connection.query(
      `INSERT INTO ledger 
      (user_id, round_id, transaction_type, entry, amount, debit, credit, 
       previous_balance, new_balance, stake_amount, results, status, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ledgerData.user_id,
        ledgerData.round_id,
        ledgerData.transaction_type,
        ledgerData.entry,
        ledgerData.amount,
        ledgerData.debit,
        ledgerData.credit,
        ledgerData.previous_balance,
        ledgerData.new_balance,
        ledgerData.stake_amount,
        ledgerData.results,
        ledgerData.status,
        ledgerData.description,
      ]
    );

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

    // Commit transaction
    await connection.commit();
    
    // Log success
    logToFolderInfo("Agent/controller", "placeBet", {
      uniqueCode: "CGP0141",
      message: `Bet placed successfully for player ${userId}`,
      data: { success: true },
    });

    res.json({ success: true, balance: updatedBalance.toFixed(2) });
  } catch (error) {
    await connection.rollback(); // Rollback on error
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
  } finally {
    connection.release(); // Release connection back to pool
  }
};
