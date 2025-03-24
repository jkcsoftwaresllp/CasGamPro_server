import { db } from "../../config/db.js";
import { users, ledger } from "../../database/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { getClientPLData } from "../clientLedger/clientPLAPI.js";

async function getTotalWithdrawalsForAgent(userId, parentId) {
  const result = await getClientPLData(userId, parentId);
  const coins = result.reduce((sum, entry) => sum + entry.overallClientPL, 0);

  return coins;
}

export async function getUserExposure(req, res) {
  try {
    const { userId } = req.params;
    const parentId = req.session.userId;

    if (!parentId) {
      return res.status(401).json({
        uniqueCode: "CGP0151",
        message: "Unauthorized access. Please log in.",
        data: {},
      });
    }

    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.parent_id, parentId)))
      .limit(1);

    if (user.length === 0) {
      return res.status(403).json({
        uniqueCode: "CGP0152",
        message: "Access denied. User does not belong to your hierarchy.",
        data: {},
      });
    }

    // Fetch the latest transaction for the user
    const latestTransaction = await db
      .select({
        amount: ledger.stake_amount,
        createdAt: ledger.created_at,
      })
      .from(ledger)
      .where(eq(ledger.user_id, userId))
      .orderBy(desc(ledger.id))
      .limit(1);

    const lastAmount =
      latestTransaction.length > 0 ? Number(latestTransaction[0].amount) : 0;

    const totalDeposited = await getTotalWithdrawalsForAgent(userId, parentId);

    return res.status(200).json({
      uniqueCode: "CGP0153",
      message: "User exposure fetched successfully",
      data: {
        userId,
        balance: lastAmount,
        coins: 200, //TODO: Replace with actual coins
      },
    });
  } catch (error) {
    console.error("Error fetching user exposure:", error);
    return res.status(500).json({
      uniqueCode: "CGP0154",
      message: "Internal server error",
      data: {},
    });
  }
}
