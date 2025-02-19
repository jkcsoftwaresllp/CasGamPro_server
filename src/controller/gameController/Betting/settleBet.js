import { db } from "../../../config/db.js";
import { bets, players, agents } from "../../../database/schema.js";
import { eq } from "drizzle-orm";

export const settleBet = async (req, res) => {
  const { betId } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({
      uniqueCode: "CGP0134",
      message: "User not authenticated",
      data: {},
    });
  }

  if (!betId) {
    return res.status(400).json({
      uniqueCode: "CGP0124",
      message: "Bet ID is required",
      data: {},
    });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // Fetch bet details
      const betResult = await tx.select().from(bets).where(eq(bets.id, betId));

      if (betResult.length === 0) {
        throw { code: "CGP0125", message: "Bet not found" };
      }

      const { playerId, betAmount, win } = betResult[0];

      // Check if the bet belongs to the logged-in user
      if (playerId !== userId) {
        throw {
          code: "CGP0133",
          message: "You are not authorized to settle this bet",
        };
      }

      if (win === null) {
        throw { code: "CGP0126", message: "Bet has not been settled yet" };
      }

      if (win < 0) {
        throw { code: "CGP0132", message: "Invalid bet result" };
      }

      // Fetch player details
      const playerResult = await tx
        .select()
        .from(players)
        .where(eq(players.id, playerId));

      if (playerResult.length === 0) {
        throw { code: "CGP0131", message: "Player not found" };
      }

      const { agentId, balance: playerBalance } = playerResult[0];

      // Fetch agent details
      const agentResult = await tx
        .select()
        .from(agents)
        .where(eq(agents.id, agentId));

      if (agentResult.length === 0) {
        throw { code: "CGP0127", message: "Agent not found" };
      }

      const { balance: agentBalance } = agentResult[0];

      // Convert balances to numbers
      let updatedAgentBalance = Number(agentBalance);
      let updatedPlayerBalance = Number(playerBalance);

      // Calculate profit and total win amount
      const profit = Number(betAmount) * Number(win); // TODO
      const totalWinAmount = Number(betAmount) + profit; 

      if (win > 0) {
        // Player wins: Deduct from agent, add to player
        if (updatedAgentBalance < totalWinAmount) {
          throw {
            code: "CGP0128",
            message: "Insufficient funds in agent's wallet",
          };
        }

        updatedAgentBalance -= totalWinAmount;
        updatedPlayerBalance += totalWinAmount;
      } else {
        // Player loses: Agent keeps the stake amount
        updatedAgentBalance += Number(betAmount);
      }

      // Update balances in database
      await tx
        .update(agents)
        .set({ balance: updatedAgentBalance.toFixed(2) })
        .where(eq(agents.id, agentId));

      await tx
        .update(players)
        .set({ balance: updatedPlayerBalance.toFixed(2) })
        .where(eq(players.id, playerId));
    });

    return res.status(200).json({
      uniqueCode: "CGP0129",
      message: "Bet settled successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in settleBet:", error);
    return res.status(500).json({
      uniqueCode: error.code || "CGP0130",
      message: error.message || "Internal server error",
      data: {},
    });
  }
};
