import { db } from "../../config/db.js";
import {
  cashLedger,
  players,
  users,
  coinsLedger,
} from "../../database/schema.js";
import { eq, and, desc, sum } from "drizzle-orm";

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

    const lastAmount =
      latestTransaction.length > 0 ? Number(latestTransaction[0].amount) : 0;

    // Fetch total deposited amount for the agent
    const totalDeposited = await db
      .select({
        total: sum(coinsLedger.amount).as("totalDeposited"),
      })
      .from(coinsLedger)
      .where(
        and(
          eq(coinsLedger.userId, userId),
          eq(coinsLedger.agentId, agentId),
          eq(coinsLedger.type, "DEPOSIT") // Only count deposits
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
