import { db } from "../../config/db.js";
import { users, ledger } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const paymentController = async (req, res) => {
  try {
    const userId = req.session.userId; // The logged-in user's ID
    const { clientId, amount, note } = req.body;

    if (!clientId || !amount || !note) {
      let errorLog = {
        uniqueCode: "PAY0001",
        message: "Missing required fields",
        data: {},
      };
      logToFolderError("Payment/controller", "paymentController", errorLog);
      return res.status(400).json(errorLog);
    }

    // Fetch client details (Player receiving the payment)
    const clientData = await db
      .select({
        id: users.id,
        parentId: users.parent_id,
        firstName: users.first_name,
        lastName: users.last_name,
        balance: users.balance,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, clientId))
      .execute();

    const client = clientData[0];
    if (!client || client.role !== "PLAYER") {
      let errorLog = {
        uniqueCode: "PAY0002",
        message: "Client not found or invalid role",
        data: {},
      };
      logToFolderError("Payment/controller", "paymentController", errorLog);
      return res.status(404).json(errorLog);
    }

    // Fetch the logged-in user (must be a parent in the hierarchy)
    const agentData = await db
      .select({
        id: users.id,
        firstName: users.first_name,
        lastName: users.last_name,
        role: users.role,
        balance: users.balance,
      })
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    const agent = agentData[0];
    if (!agent || !["ADMIN", "SUPERAGENT", "AGENT"].includes(agent.role)) {
      let errorLog = {
        uniqueCode: "PAY0003",
        message: "Unauthorized action",
        data: {},
      };
      logToFolderError("Payment/controller", "paymentController", errorLog);
      return res.status(403).json(errorLog);
    }

    // Ensure hierarchical relationship (agent must be parent of client)
    if (client.parentId !== agent.id) {
      let errorLog = {
        uniqueCode: "PAY0004",
        message: "Client does not belong to the agent",
        data: {},
      };
      logToFolderError("Payment/controller", "paymentController", errorLog);
      return res.status(403).json(errorLog);
    }

    // Calculate new balance
    const newBalance = parseFloat(client.balance) - parseFloat(amount);
    if (newBalance < 0) {
      let errorLog = {
        uniqueCode: "PAY0005",
        message: "Insufficient balance",
        data: {
          currentBalance: client.balance,
          attemptedDebit: amount,
        },
      };
      logToFolderError("Payment/controller", "paymentController", errorLog);
      return res.status(400).json(errorLog);
    }

    // **Update Client Balance**
    const updateResult = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, clientId))
      .execute();

    if (!updateResult) {
      let errorLog = {
        uniqueCode: "PAY0006",
        message: "Failed to update balance",
        data: {},
      };
      logToFolderError("Payment/controller", "paymentController", errorLog);
      return res.status(500).json(errorLog);
    }

    // **Insert into Ledger**
    const ledgerEntry = await db
      .insert(ledger)
      .values({
        user_id: clientId,
        transaction_type: "TRANSFER",
        entry: note,
        amount,
        debit: amount,
        credit: 0,
        previous_balance: client.balance,
        new_balance: newBalance,
        status: "PAID",
        description: `Payment processed by ${agent.firstName} ${agent.lastName}`,
      })
      .execute();

    if (!ledgerEntry) {
      let errorLog = {
        uniqueCode: "PAY0007",
        message: "Failed to insert transaction into ledger",
        data: {},
      };
      logToFolderError("Payment/controller", "paymentController", errorLog);
      return res.status(500).json(errorLog);
    }

    // ✅ **Final Response**
    let successLog = {
      uniqueCode: "PAY0008",
      message: "Payment successful",
      data: {
        clientId,
        clientName: `${client.firstName} ${client.lastName}`,
        balance: newBalance,
        status: "PAID",
      },
    };
    logToFolderInfo("Payment/controller", "paymentController", successLog);

    return res.status(200).json(successLog);
  } catch (error) {
    let errorLog = {
      uniqueCode: "PAY0009",
      message: "Internal server error",
      data: { error: error.message },
    };
    logToFolderError("Payment/controller", "paymentController", errorLog);
    return res.status(500).json(errorLog);
  }
};