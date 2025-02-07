import { db } from "../../config/db.js";
import { agents, players, ledger, users } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const paymentController = async (req, res) => {
  try {
    const agentId = req.session.userId;
    const { clientId, amount, note } = req.body;

    if (!clientId || !amount || !note) {
      let errorLog = {
        uniqueCode: "PAY0001",
        message: "Missing required fields",
        data: {},
      };
      logToFolderError("Agent/controller", "paymentController", errorLog);
      return res.status(400).json(errorLog);
    }

    // Fetch client details
    const clientData = await db
      .select({
        clientId: players.id,
        userId: players.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        balance: players.balance,
      })
      .from(players)
      .innerJoin(users, eq(players.userId, users.id))
      .where(eq(players.id, clientId))
      .execute();

    const client = clientData[0];
    if (!client) {
      let errorLog = {
        uniqueCode: "PAY0002",
        message: "Client not found",
        data: {},
      };
      logToFolderError("Agent/controller", "paymentController", errorLog);
      return res.status(404).json(errorLog);
    }

    // Fetch agent details
    const agentData = await db
      .select({
        agentId: agents.id,
        userId: agents.userId,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(agents)
      .innerJoin(users, eq(agents.userId, users.id))
      .where(eq(agents.userId, agentId))
      .execute();

    const agent = agentData[0];
    if (!agent) {
      let errorLog = {
        uniqueCode: "PAY0003",
        message: "Agent not found",
        data: {},
      };
      logToFolderError("Agent/controller", "paymentController", errorLog);
      return res.status(404).json(errorLog);
    }

    // Calculate new balance
    const newBalance = parseFloat(client.balance) - parseFloat(amount);
    if (newBalance < 0) {
      let errorLog = {
        uniqueCode: "PAY0004",
        message: "Insufficient balance",
        data: {
          currentBalance: client.balance,
          attemptedDebit: amount,
        },
      };
      logToFolderError("Agent/controller", "paymentController", errorLog);
      return res.status(400).json(errorLog);
    }

    // Determine transaction status
    const status = amount <= client.balance ? "PAID" : "PENDING";

    // **Update Client Balance**
    const updateResult = await db
      .update(players)
      .set({ balance: newBalance })
      .where(eq(players.id, clientId))
      .execute();

    if (!updateResult) {
      let errorLog = {
        uniqueCode: "PAY0005",
        message: "Failed to update balance",
        data: {},
      };
      logToFolderError("Agent/controller", "paymentController", errorLog);
      return res.status(500).json(errorLog);
    }

    // **Insert into Ledger**
    const ledgerEntry = await db
      .insert(ledger)
      .values({
        userId: clientId,
        date: new Date(),
        entry: note,
        amount,
        debit: amount,
        credit: 0,
        balance: newBalance,
        status: status,
        stakeAmount: amount,
        result: status === "PAID" ? "WIN" : "BET_PLACED",
      })
      .execute();

    if (!ledgerEntry) {
      let errorLog = {
        uniqueCode: "PAY0006",
        message: "Failed to insert transaction into ledger",
        data: {},
      };
      logToFolderError("Agent/controller", "paymentController", errorLog);
      return res.status(500).json(errorLog);
    }

    // ✅ **Final Response**
    let successLog = {
      uniqueCode: "PAY0007",
      message: "Payment status updated successfully",
      data: {
        clientId,
        clientName: `${client.firstName} ${client.lastName}`,
        balance: newBalance,
        status,
      },
    };
    logToFolderInfo("Agent/controller", "paymentController", successLog);

    return res.status(200).json(successLog);
  } catch (error) {
    let errorLog = {
      uniqueCode: "PAY0008",
      message: "Internal server error",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "paymentController", errorLog);
    return res.status(500).json(errorLog);
  }
};
