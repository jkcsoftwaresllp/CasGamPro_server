import { db } from "../../config/db.js";
import {
  cashLedger,
  players,
  users,
  coinsLedger,
  agents,
} from "../../database/schema.js";
import { eq, and, desc, inArray, sum } from "drizzle-orm";

async function getTotalWithdrawalsForAgent(agentId) {
  const playerIds = await db
    .select({ id: players.userId })
    .from(players)
    .innerJoin(agents, eq(players.agentId, agents.id));

  const playerIdArray = playerIds.map((player) => player.id);

  if (playerIdArray.length === 0) {
    return 0;
  }

  const result = await db
    .select({ totalWithdrawal: sum(coinsLedger.amount) })
    .from(coinsLedger)
    .where(
      and(
        eq(coinsLedger.type, "withdrawal"),
        inArray(coinsLedger.userId, playerIdArray)
      )
    );

  return result[0]?.totalWithdrawal || 0;
}

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

    const totalDeposited = await getTotalWithdrawalsForAgent(agentId);

    return res.status(200).json({
      uniqueCode: "CGP0153",
      message: "User exposure fetched successfully",
      data: {
        userId,
        balance: lastAmount,
        coins: totalDeposited,
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
