import { db } from "../../config/db.js";
import { cashLedger, users, players } from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";

// Function to fetch the latest transaction per player
async function fetchLatestTransactions(agentId) {
  return await db
    .select({
      clientId: players.userId,
      clientName: users.username,
      agentId: cashLedger.agentId,
      amount: cashLedger.amount,
    })
    .from(cashLedger)
    .innerJoin(players, eq(cashLedger.playerId, players.id))
    .innerJoin(users, eq(players.userId, users.id))
    .where(eq(cashLedger.agentId, agentId))
    .where(
      eq(
        cashLedger.id,
        sql`(SELECT MAX(id) FROM ${cashLedger} WHERE playerId = ${cashLedger.playerId})`
      )
    ); // Get only the latest transaction per player
}

// Fetch collection report and categorize transactions
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

    // Fetch the latest transactions for each player
    const transactions = await fetchLatestTransactions(agentId);

    // Categorize transactions based on the amount
    const paymentReceivingFrom = [];
    const paymentPaidTo = [];
    const paymentCleared = [];

    transactions.forEach(({ clientId, clientName, amount }) => {
      if (amount < 0) {
        paymentReceivingFrom.push({
          id: clientId,
          name: clientName,
          balance: Math.abs(amount),
        });
      } else if (amount > 0) {
        paymentPaidTo.push({
          id: clientId,
          name: clientName,
          balance: -amount,
        });
      } else {
        paymentCleared.push({
          id: clientId,
          name: clientName,
          balance: amount,
        });
      }
    });

    // Check if all lists are empty
    if (
      !paymentReceivingFrom.length &&
      !paymentPaidTo.length &&
      !paymentCleared.length
    ) {
      return res.status(404).json({
        uniqueCode: "CGP0073",
        message: "No transactions found",
        data: {
          results: { paymentReceivingFrom, paymentPaidTo, paymentCleared },
        },
      });
    }

    return res.status(200).json({
      uniqueCode: "CGP0075",
      message: "Collection report fetched successfully",
      data: { paymentReceivingFrom, paymentPaidTo, paymentCleared },
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
