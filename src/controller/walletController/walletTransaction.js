import { db } from "../../config/db.js";
import { players, agents, coinsLedger } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import Decimal from "decimal.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";
import socketManager from "../../services/shared/config/socket-manager.js";

export const walletTransaction = async (req, res) => {
  const { userId, type, amount } = req.body;

  if (!userId || !type || !amount) {
    let temp = {
      uniqueCode: "CGP0057",
      message: "User ID, type, and amount are required",
      data: {},
    };
    logToFolderError("Agent/controller", "walletTransaction", temp);
    return res.status(400).json(temp);
  }

  if (amount <= 0) {
    let temp2 = {
      uniqueCode: "CGP0064",
      message: "Invalid amount",
      data: {},
    };
    logToFolderError("Agent/controller", "walletTransaction", temp2);
    return res.status(400).json(temp2);
  }

  try {
    // Fetch current user balance
    const user = await db
      .select()
      .from(players)
      .where(eq(players.userId, userId))
      .limit(1);

    if (!user.length) {
      let temp3 = {
        uniqueCode: "CGP0059",
        message: "User not found",
        data: {},
      };
      logToFolderInfo("Agent/controller", "walletTransaction", temp3);
      return res.status(404).json(temp3);
    }

    const clientBalance = new Decimal(user[0].balance);
    const agentId = user[0].agentId;

    // Fetch agent's balance
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!agent.length) {
      let temp8 = {
        uniqueCode: "CGP0122",
        message: "Agent not found",
        data: {},
      };
      logToFolderError("Agent/controller", "walletTransaction", temp8);
      return res.status(404).json(temp8);
    }

    const agentBalance = new Decimal(agent[0].balance);
    let newClientBalance;
    let newAgentBalance;

    if (type === "deposit") {
      // Ensure agent has enough funds before depositing
      if (agentBalance.lessThan(amount)) {
        let temp9 = {
          uniqueCode: "CGP0123",
          message: "Agent has insufficient balance for deposit",
          data: {},
        };
        logToFolderError("Wallet/controller", "walletTransaction", temp9);
        return res.status(400).json(temp9);
      }

      newClientBalance = clientBalance.plus(amount);
      newAgentBalance = agentBalance.minus(amount);
    } else if (type === "withdrawal") {
      if (clientBalance.lessThan(amount)) {
        let temp4 = {
          uniqueCode: "CGP0060",
          message: "Insufficient balance for withdrawal",
          data: {},
        };
        logToFolderInfo("Agent/controller", "walletTransaction", temp4);
        return res.status(400).json(temp4);
      }
      newClientBalance = clientBalance.minus(amount);
      newAgentBalance = agentBalance.plus(amount);
    } else {
      let temp5 = {
        uniqueCode: "CGP0061",
        message: "Invalid transaction type",
        data: {},
      };
      logToFolderError("Agent/controller", "walletTransaction", temp5);
      return res.status(400).json(temp5);
    }

    // Update client and agent balances in a single transaction
    await db.transaction(async (trx) => {
      await trx
        .update(players)
        .set({ balance: newClientBalance.toFixed(2) })
        .where(eq(players.userId, userId));

      await trx
        .update(agents)
        .set({ balance: newAgentBalance.toFixed(2) })
        .where(eq(agents.id, agentId));

      // Insert transaction record
      await trx.insert(coinsLedger).values({
        userId,
        agentId,
        type,
        amount: amount.toFixed(2),
        previousBalance: agentBalance.toFixed(2),
        newBalance: newAgentBalance.toFixed(2),
        createdAt: new Date(),
      });
    });

    socketManager.broadcastWalletUpdate(
      user[0].id,
      newClientBalance.toFixed(2)
    );
    socketManager.broadcastWalletUpdate(
      agent[0].userId,
      newAgentBalance.toFixed(2)
    );

    let temp6 = {
      uniqueCode: "CGP0062",
      message: "Transaction successful",
      data: {
        clientBalance: newClientBalance.toFixed(2),
        agentBalance: newAgentBalance.toFixed(2),
      },
    };
    logToFolderInfo("Agent/controller", "walletTransaction", temp6);
    return res.status(200).json(temp6);
  } catch (error) {
    let temp7 = {
      uniqueCode: "CGP0063",
      message: "Internal Server Error",
      data: { error: error.message },
    };
    console.error(error);
    logToFolderError("Agent/controller", "walletTransaction", temp7);
    return res.status(500).json(temp7);
  }
};
