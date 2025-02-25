import { db } from "../../../config/db.js";
import { users, bets, players, agents, ledger } from "../../../database/schema.js";
import { eq } from "drizzle-orm";
import Decimal from "decimal.js";
import {
  logToFolderError,
  logToFolderInfo,
} from "../../../utils/logToFolder.js";
import gameManager from "../../../services/shared/config/manager.js";
import redis from "../../../config/redis.js";
import { validateBetAmount } from "./getBettingRange.js";
import { checkBetBlocking } from "./checkBetBlocking.js";
import { getValidBetOptions } from "./getValidBetOptions.js";

// Place the bet
export const placeBet = async (req, res) => {
  try {
    const { roundId, amount, side } = req.body;

    const userId = req.session.userId;

    // Check blocking level before placing the bet
    await checkBetBlocking(userId);

    // Fetch client details
    const client = await db
      .select()
      .from(players)
      .where(eq(players.userId, userId))
      .limit(1);
    if (!client.length) {
      return res.status(404).json({
        uniqueCode: "CGP0137",
        data: { message: "Client not found" },
      });
    }

    // Fetch agent details
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, client[0].agentId))
      .limit(1);
    if (!agent.length) {
      return res.status(404).json({
        uniqueCode: "CGP0138",
        data: { message: "Agent not found" },
      });
    }

    let clientBalance = new Decimal(client[0].balance);
    let agentBalance = new Decimal(agent[0].balance);

    // Validate bet amount
    const betValidation = await validateBetAmount(userId, amount);
    if (!betValidation.data.success) {
      return res.status(400).json({
        uniqueCode: "CGP0139",
        data: { message: "Invalid bet amount" },
      });
    }

    // Check if client has enough balance
    if (clientBalance.lessThan(amount)) {
      return res.status(400).json({
        uniqueCode: "CGP0140",
        data: { message: "Insufficient balance" },
      });
    }

    // Deduct from client and add to agent
    clientBalance = clientBalance.minus(amount);
    agentBalance = agentBalance.plus(amount);
    // Perform the balance update transaction
    await db.transaction(async (trx) => {
      await trx
        .update(players)
        .set({ balance: clientBalance.toFixed(2) })
        .where(eq(players.userId, userId));

      await trx
        .update(agents)
        .set({ balance: agentBalance.toFixed(2) })
        .where(eq(agents.id, client[0].agentId));

      // Save the bet details
      await trx.insert(bets).values({
        playerId: client[0].id,
        roundId,
        betAmount: new Decimal(amount).toFixed(2),
        betSide: side,
        status: "PENDING",
      });

      // Insert ledger entry for bet placement
      await trx.insert(ledger).values({
        userId,
        date: new Date(),
        entry: "Bet placed",
        debit: amount,
        credit: 0,
        balance: clientBalance.toFixed(2),
        roundId,
        status: "PENDING",
        result: "BET_PLACED",
        stakeAmount: -1*amount, 
        amount: amount,  //TODO: Check if this is correct
      });
    });

    // Proceed with placing the bet
    const result = await gameManager.placeBet(userId, roundId, amount, side);

    // Log the successful bet placement
    let successLog = {
      uniqueCode: "CGP0141",
      message: `Bet placed successfully for player ${userId}`,
      data: {
        userId,
        amount,
        roundId,
        side,
        clientBalance: clientBalance.toFixed(2),
        agentBalance: agentBalance.toFixed(2),
      },
    };
    logToFolderInfo("Agent/controller", "placeBet", successLog);

    res.json(result);
  } catch (error) {
    // If error has a custom status (e.g., blocking error), send the error response
    if (error.status && error.message) {
      return res.status(error.status).json(error.message);
    }

    // console.log("Place Bet Error",error); 
  
    // Handle unexpected errors
    res.status(400).json({
      uniqueCode: error.uniqueCode || "CGP0142",
      message: error.message,
      data: error.data || { success: false },
    });
  }
};
