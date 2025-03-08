import { db } from "../../config/db.js";
import { cashLedger, players, users } from "../../database/schema.js";
import { eq, and, desc } from "drizzle-orm";

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

    // Fetch the latest transaction for the agent
    const latestTransaction = await db
      .select({
        amount: cashLedger.amount,
        createdAt: cashLedger.createdAt,
      })
      .from(cashLedger)
      .innerJoin(players, eq(cashLedger.playerId, players.id))
      .innerJoin(users, eq(players.userId, users.id))
      .where(and(eq(players.userId, userId), eq(cashLedger.agentId, agentId)))
      .orderBy(desc(cashLedger.id))
      .limit(1);

    // If no transactions found, return balance as 0
    if (latestTransaction.length === 0) {
      return res.status(200).json({
        uniqueCode: "CGP0156",
        message: "Agent exposure fetched successfully",
        data: { userId, balance: 0 },
      });
    }

    const lastAmount = Number(latestTransaction[0].amount);
    const balance = lastAmount < 0 ? lastAmount : 0;

    return res.status(200).json({
      uniqueCode: "CGP0156",
      message: "Agent exposure fetched successfully",
      data: { userId, balance },
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
