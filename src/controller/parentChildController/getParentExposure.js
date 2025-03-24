import { db } from "../../config/db.js";
import { eq, and, desc, sum } from "drizzle-orm";
import { ledger, users, wallet_transactions } from "../../database/schema.js";

export async function getParentExposure(req, res) {
  try {
    const { userId } = req.params;
    const parentId = req.session.userId;

    if (!parentId) {
      return res.status(401).json({
        uniqueCode: "CGP0155",
        message: "Unauthorized access. Please log in.",
        data: {},
      });
    }

    // Validate that the requested user is a child of the parent
    const childUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.parent_id, parentId)));

    if (childUser.length === 0) {
      return res.status(403).json({
        uniqueCode: "CGP0158",
        message: "Unauthorized access to child data.",
        data: {},
      });
    }

    // Fetch the latest transaction for the agent
    const latestTransaction = await db
      .select({
        amount: ledger.amount,
        createdAt: ledger.created_at,
      })
      .from(ledger)
      .where(eq(ledger.user_id, userId))
      .orderBy(desc(ledger.id))
      .limit(1);

    const lastAmount =
      latestTransaction.length > 0 ? Number(latestTransaction[0].amount) : 0;

    // Fetch total deposited amount for the agent
    const totalDeposited = await db
      .select({
        total: sum(wallet_transactions.amount).as("totalDeposited"),
      })
      .from(wallet_transactions)
      .where(
        and(
          eq(wallet_transactions.user_id, userId),
          eq(wallet_transactions.transaction_type, "DEPOSIT") // Only count deposits
        )
      );

    const depositedAmount = totalDeposited[0]?.total
      ? Number(totalDeposited[0].total)
      : 0;

    return res.status(200).json({
      uniqueCode: "CGP0156",
      message: "Agent exposure fetched successfully",
      data: {
        userId,
        balance: lastAmount,
        coins: depositedAmount,
      },
    });
  } catch (error) {
    console.error("Error fetching agent exposure:", error);
    return res.status(500).json({
      uniqueCode: "CGP0157",
      message: "Internal server error",
      data: {},
    });
  }
}
