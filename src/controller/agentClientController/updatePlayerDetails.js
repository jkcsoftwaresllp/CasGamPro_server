import { eq, and } from "drizzle-orm";
import { db } from "../../config/db.js";
import { players, users, agents } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const updatePlayerDetails = async (req, res) => {
  const userId = req.params.id;
  const agentId = req.session.userId;

  if (!userId || !agentId) {
    let errorResponse = {
      uniqueCode: "CGP0040",
      message: "User ID and Agent ID are required",
      data: {},
    };
    logToFolderError("Agent/controller", "updatePlayerDetails", errorResponse);
    return res.status(400).json(errorResponse);
  }

  const { firstName, lastName, currentBalance, agentBlocked, betsBlocked } =
    req.body;

  try {
    // Check if the agent manages this player
    const playerData = await db
      .select({
        playerId: players.userId,
        playerBalance: players.balance,
        agentId: agents.id,
        agentBalance: agents.balance,
      })
      .from(players)
      .innerJoin(agents, eq(players.agentId, agents.id))
      .where(and(eq(players.userId, userId), eq(agents.userId, agentId)));

    if (playerData.length === 0) {
      let errorResponse = {
        uniqueCode: "CGP0041",
        message: "Player not found under this agent",
        data: {},
      };
      logToFolderError(
        "Agent/controller",
        "updatePlayerDetails",
        errorResponse
      );
      return res.status(404).json(errorResponse);
    }

    const { playerBalance, agentBalance } = playerData[0];

    // Fetch the existing user from users table
    const user = await db.select().from(users).where(eq(users.id, userId));

    if (!user.length) {
      let errorResponse = {
        uniqueCode: "CGP0041",
        message: "User not found",
        data: {},
      };
      logToFolderError(
        "Agent/controller",
        "updatePlayerDetails",
        errorResponse
      );
      return res.status(404).json(errorResponse);
    }

    // Validate balance if provided
    if (currentBalance !== undefined) {
      if (isNaN(currentBalance)) {
        let errorResponse = {
          uniqueCode: "CGP0045",
          message: "Balance should be a valid number",
          data: {},
        };
        logToFolderError(
          "Agent/controller",
          "updatePlayerDetails",
          errorResponse
        );
        return res.status(400).json(errorResponse);
      }

      // Calculate the required balance difference
      const balanceDifference = currentBalance - playerBalance;

      // Ensure the agent has enough balance
      if (balanceDifference > 0 && balanceDifference > agentBalance) {
        let errorResponse = {
          uniqueCode: "CGP0046",
          message: "Insufficient balance: Agent does not have enough funds",
          data: {},
        };
        logToFolderError(
          "Agent/controller",
          "updatePlayerDetails",
          errorResponse
        );
        return res.status(403).json(errorResponse);
      }

      // Update agent's balance
      const newAgentBalance = agentBalance - balanceDifference;
      await db
        .update(agents)
        .set({ balance: newAgentBalance })
        .where(eq(agents.id, playerData[0].agentId));

      // Update player's balance correctly
      await db
        .update(players)
        .set({ balance: currentBalance })
        .where(eq(players.userId, userId));
    }

    // Blocking logic
    const updatedAgentBlocked =
      agentBlocked !== undefined
        ? agentBlocked
          ? "LEVEL_1"
          : "NONE"
        : user[0].blocking_levels;
    const updatedBetsBlocked =
      betsBlocked !== undefined
        ? betsBlocked
          ? "LEVEL_2"
          : "NONE"
        : user[0].blocking_levels;

    // Update the users table
    await db
      .update(users)
      .set({
        firstName: firstName ?? user[0].firstName,
        lastName: lastName ?? user[0].lastName,
      })
      .where(eq(users.id, userId));

    // Update blocking levels only if changed
    // if (agentBlocked !== undefined || betsBlocked !== undefined) {
    //   await db
    //     .update(players)
    //     .set({
    //       agentBlocked: updatedAgentBlocked,
    //       betsBlocked: updatedBetsBlocked,
    //     })
    //     .where(eq(players.userId, userId));
    // }

    let successResponse = {
      uniqueCode: "CGP0043",
      message: "User and player details updated successfully",
      data: {
        firstName,
        lastName,
        balance: currentBalance,
        agentBlocked: updatedAgentBlocked,
        betsBlocked: updatedBetsBlocked,
      },
    };
    logToFolderInfo("Agent/controller", "updatePlayerDetails", successResponse);

    return res.status(200).json(successResponse);
  } catch (error) {
    let errorResponse = {
      uniqueCode: "CGP0044",
      message: "Error updating player details",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "updatePlayerDetails", errorResponse);
    return res.status(500).json(errorResponse);
  }
};
