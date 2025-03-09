import { db } from "../../config/db.js";
import {
  cashLedger,
  players,
  users,
  coinsLedger,
  agents,
  coinsLedgerType,
} from "../../database/schema.js";
import { eq, and, desc, sum } from "drizzle-orm";

export async function getUserExposure(req, res) {
  try {
    const { userId } = req.params;
    const agentId = req.session.userId;

    if (!agentId) {
      return res.status(401).json({
        uniqueCode: "CGP0151",
        message: "Unauthorized access. Please log in.",
        data: {},
      });
    }

    // Fetch the latest transaction for the user
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

    const totalDeposited = await db
      .select({
        total: coinsLedger.amount,
      })
      .from(coinsLedger)
      .innerJoin(agents, eq(coinsLedger.agentId, agents.id))
      .innerJoin(users, eq(coinsLedger.userId, users.id))
      .where(
        eq(coinsLedger.type, coinsLedgerType.config.enumValues.WITHDRAWAL)
      );
    console.log(totalDeposited);

    const depositedAmount = totalDeposited[0]?.total
      ? Number(totalDeposited[0].total)
      : 0;

    return res.status(200).json({
      uniqueCode: "CGP0153",
      message: "User exposure fetched successfully",
      data: {
        userId,
        balance: lastAmount,
        coins: depositedAmount,
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
