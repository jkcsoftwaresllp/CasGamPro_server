import { db } from "../../config/db.js";
import { cashLedger, users, players } from "../../database/schema.js";
import { eq, sum, gt, lt, desc, sql } from "drizzle-orm";

// Function to fetch transaction data based on balance condition
async function fetchPayments(agentId, condition) {
  return await db
    .select({
      clientId: players.userId, // Player's userId
      clientName: users.username, // Player's username
      agentId: cashLedger.agentId, // Agent's ID
      balance: sum(cashLedger.amount).as("balance"), // Total transaction balance
    })
    .from(cashLedger)
    .innerJoin(players, eq(cashLedger.playerId, players.id))
    .innerJoin(users, eq(players.userId, users.id))
    .where(eq(cashLedger.agentId, agentId)) // Fetch only the agent's clients
    .groupBy(players.userId, users.username, cashLedger.agentId)
    .having(condition(sum(cashLedger.amount), 0)) // Apply condition (owe, overpaid, settled)
    .orderBy(sum(cashLedger.amount));
}

// Function to update transactionType and status based on balance
async function updateTransactionStatus(agentId) {
  const transactions = await db
    .select({
      transactionId: cashLedger.id,
      balance: sum(cashLedger.amount).as("balance"),
    })
    .from(cashLedger)
    .where(eq(cashLedger.agentId, agentId))
    .groupBy(cashLedger.id);

  for (const { transactionId, balance } of transactions) {
    let transactionType, status;

    if (balance > 0) {
      transactionType = "TAKE";
      status = "PENDING";
    } else if (balance < 0) {
      transactionType = "GIVE";
      status = "PENDING";
    } else {
      transactionType = undefined;
      status = "COMPLETED";
    }

    await db
      .update(cashLedger)
      .set({
        ...(transactionType ? { transactionType } : {}), // Only update if transactionType changes
        status,
      })
      .where(eq(cashLedger.id, transactionId));
  }
}

// Fetch collection report and update transactions
export async function getCollectionReport(req, res) {
  try {
    const agentId = req.session.userId;

    // Validate session user
    if (!agentId) {
      return res.status(401).json({
        uniqueCode: "CGP0072",
        message: "Unauthorized access. Please log in.",
        data: {},
      });
    }

    // Fetch different types of payments
    const [pendingPayments, receivedPayments, clearedPayments] =
      await Promise.all([
        fetchPayments(agentId, gt), // Clients who owe the agent
        fetchPayments(agentId, lt), // Clients who overpaid
        fetchPayments(agentId, eq), // Fully settled transactions
      ]);

    // Update transactions based on balance conditions
    await updateTransactionStatus(agentId);

    const formattedResults = {
      pendingPayments,
      receivedPayments,
      clearedPayments,
    };

    // Check if all lists are empty
    if (
      !pendingPayments.length &&
      !receivedPayments.length &&
      !clearedPayments.length
    ) {
      return res.status(404).json({
        uniqueCode: "CGP0073",
        message: "No transactions found",
        data: { results: formattedResults },
      });
    }

    return res.status(200).json({
      uniqueCode: "CGP0075",
      message: "Collection report fetched successfully",
      data: {
        paymentReceivingFrom: pendingPayments.map(
          ({ clientId, clientName, balance }) => ({
            id: clientId,
            name: clientName,
            balance,
          })
        ),
        paymentPaidTo: receivedPayments.map(
          ({ clientId, clientName, balance }) => ({
            id: clientId,
            name: clientName,
            balance,
          })
        ),
        paymentCleared: clearedPayments.map(
          ({ clientId, clientName, balance }) => ({
            id: clientId,
            name: clientName,
            balance,
          })
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching collection report:", error);
    return res.status(500).json({
      uniqueCode: "CGP0076",
      message: "Internal server error",
      data: {},
    });
  }
}
