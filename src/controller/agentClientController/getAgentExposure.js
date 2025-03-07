import { db } from "../../config/db.js";
import { cashLedger, players, users } from "../../database/schema.js";
import { eq, and, asc } from "drizzle-orm";

export async function getAgentExposure(req, res) {
  try {
    const { userId } = req.params;
    const agentId = req.session.userId;

    if (!agentId) {
      return res.status(401).json({
        uniqueCode: "CGP0155",
        message: "Unauthorized access. Please log in.",
        data: {},
      });
    }

    const transactions = await db
      .select({
        amount: cashLedger.amount,
        transactionType: cashLedger.transactionType,
        status: cashLedger.status,
        createdAt: cashLedger.createdAt,
      })
      .from(cashLedger)
      .innerJoin(players, eq(cashLedger.playerId, players.id))
      .innerJoin(users, eq(players.userId, users.id))
      .where(and(eq(players.userId, userId), eq(cashLedger.agentId, agentId)))
      .orderBy(asc(cashLedger.createdAt));

    let balance = 0;
    for (const transaction of transactions) {
      if (
        (transaction.transactionType === "TAKE" ||
          transaction.status === "COMPLETED") &&
        Number(transaction.amount) < 0
      ) {
        balance = 0;
      } else {
        balance += Number(transaction.amount);
      }
    }

    return res.status(200).json({
      uniqueCode: "CGP0156",
      message: "User exposure fetched successfully",
      data: { userId, balance },
    });
  } catch (error) {
    console.error("Error fetching user exposure:", error);
    return res.status(500).json({
      uniqueCode: "CGP0157",
      message: "Internal server error",
      data: {},
    });
  }
}
