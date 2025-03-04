import { db } from "../../config/db.js";
import {
  agentTransactions,
  users,
  agents,
  players,
} from "../../database/schema.js";
import { eq, sum, gt, lt, desc } from "drizzle-orm";

// Function to fetch transaction data based on balance condition
async function fetchPayments(agentId, condition) {
  return await db
    .select({
      clientId: players.userId, // Player's userId
      clientName: users.username, // Player's username
      agentId: agentTransactions.agentId, // Agent's ID
      agentName: agents.userId, // Agent's userId reference
      balance: sum(agentTransactions.amount).as("balance"), // Total transaction balance
    })
    .from(agentTransactions)
    .innerJoin(players, eq(agentTransactions.playerId, players.id)) // Link transactions with players
    .innerJoin(users, eq(players.userId, users.id))
    .innerJoin(agents, eq(agentTransactions.agentId, agents.id)) // Link transactions with agents
    .where(eq(agentTransactions.agentId, agentId)) // Filter by agent
    .groupBy(
      players.userId,
      users.username,
      agentTransactions.agentId,
      agents.userId
    )
    .having(condition(sum(agentTransactions.amount), 0)) // Apply the condition
    .orderBy(desc(sum(agentTransactions.amount)));
}

// Fetch collection report
export async function getCollectionReport(req, res) {
  try {
    const agentId = req.session.userId; // Get agent's userId from session

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
