import { db } from "../../../config/db.js";
import { bets, players, agents, ledger } from "../../../database/schema.js";
import { eq } from "drizzle-orm";
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
    const clientData = await db.transaction(async (trx) => {
      const client = await trx
        .select()
        .from(players)
        .where(eq(players.userId, userId))
        .limit(1);
      if (!client.length)
        throw {
          status: 404,
          uniqueCode: "CGP0137",
          message: "Client not found",
        };

      const agent = await trx
        .select()
        .from(agents)
        .where(eq(agents.id, client[0].agentId))
        .limit(1);
      if (!agent.length)
        throw {
          status: 404,
          uniqueCode: "CGP0138",
          message: "Agent not found",
        };

      return { client: client[0], agent: agent[0] };
    });

    let clientBalance = new Decimal(clientData.client.balance);
    let agentBalance = new Decimal(clientData.agent.balance);
    let agentId = clientData.agent.id;

    if (clientBalance.lessThan(amount)) {
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
      clientBalance = clientBalance.minus(amount);
      agentBalance = agentBalance.plus(amount);

      await trx
        .update(players)
        .set({ balance: clientBalance.toFixed(2) })
        .where(eq(players.userId, userId));
      await trx
        .update(agents)
        .set({ balance: agentBalance.toFixed(2) })
        .where(eq(agents.id, clientData.client.agentId));

      // Insert bet details
      betResult = await trx.insert(bets).values({
        playerId: clientData.client.id,
        roundId,
        betAmount: new Decimal(amount).toFixed(2),
        betSide: side,
        status: "PENDING",
      });

      const gameType = preBetResult.data.gameType;

      // Insert ledger entry
      await trx.insert(ledger).values({
        userId,
        date: new Date(),
        entry: `Bet placed on ${gameType}`,
        debit: amount,
        credit: 0,
        balance: clientBalance.toFixed(2),
        roundId,
        status: "PENDING",
        result: "BET_PLACED",
        stakeAmount: -amount,
        amount,
      });
    });

    // Update game data
    const game = preBetResult.data.game;
    const userBets = game.bets.get(userId) || [];
    const stakeUpdate = {
      side,
      stake: amount,
      odd: preBetResult.data.odd,
      amount: preBetResult.data.amountAfterMultiplier,
      timestamp: Date.now(),
    };

    userBets.push(stakeUpdate);
    game.bets.set(userId, userBets);

    // Broadcast updates
    SocketManager.broadcastWalletUpdate(userId, clientBalance.toFixed(2));
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
