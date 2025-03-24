import { db } from "../../config/db.js";
import { eq, desc, sql } from "drizzle-orm";
import { ledger, users } from "../../database/schema.js";

// Function to fetch the latest transaction per player
async function fetchLatestTransactions(parentId) {
  return await db
    .select({
      childId: users.id,
      childName: users.first_name,
      parentId: users.parent_id,
      amount: ledger.stake_amount,
    })
    .from(ledger)
    .innerJoin(users, eq(ledger.user_id, users.id))
    .where(eq(users.parent_id, parentId))
    .where(
      eq(
        ledger.id,
        sql`(SELECT MAX(id) FROM ${ledger} WHERE user_id = ${ledger.user_id})`
      )
    ); // Get only the latest transaction per player
}

// Fetch collection report and categorize transactions
export async function getCollectionReport(req, res) {
  try {
    const parentId = req.session.userId;

    // Validate session user
    if (!parentId) {
      return res.status(401).json({
        uniqueCode: "CGP0072",
        message: "Unauthorized access. Please log in.",
        data: {},
      });
    }

    // Fetch the latest transactions for each player
    const transactions = await fetchLatestTransactions(parentId);

    // Categorize transactions based on the amount
    const paymentReceivingFrom = [];
    const paymentPaidTo = [];
    const paymentCleared = [];

    transactions.forEach(({ childId, childName, amount }) => {
      if (amount < 0) {
        paymentReceivingFrom.push({
          id: childId,
          name: childName,
          balance: Math.abs(amount),
        });
      } else if (amount > 0) {
        paymentPaidTo.push({
          id: childId,
          name: childName,
          balance: -amount,
        });
      } else {
        paymentCleared.push({
          id: childId,
          name: childName,
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
