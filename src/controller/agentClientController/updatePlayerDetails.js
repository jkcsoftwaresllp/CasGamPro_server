import { db } from "../../config/db.js";
import { logger } from "../../logger/logger.js";
import { agents, players, users } from "../../database/schema.js";

export const updatePlayerDetails = async (req, res) => {
  const agentId = req.session.userId;

  const { playerId } = req.params;
  const { firstName, lastName, currentLimit, agentBlocked, betsBlocked } =
    req.body;

  try {
    // Check if the logged-in user is an agent
    const [agent] = await db.select().from(agents).where({ userId: agentId });
    if (!agent) {
      return res.status(403).json({
        uniqueCode: "CGP0040",
        message: "Not authorized as agent",
        data: {},
      });
    }

    // Find the player
    const [player] = await db.select().from(players).where({ id: playerId });
    if (!player) {
      return res.status(404).json({
        uniqueCode: "CGP0041",
        message: "Player not found",
        data: {},
      });
    }

    // Check if the player is under the agent's management
    if (player.agentId !== agent.id) {
      return res.status(403).json({
        uniqueCode: "CGP0042",
        message: "You can only edit players under your management",
        data: {},
      });
    }
    // Validate fields if needed
    if (currentLimit && isNaN(currentLimit)) {
      return res.status(400).json({
        uniqueCode: "CGP0045",
        message: "Current Limit should be a valid number",
        data: {},
      });
    }
    // Prepare the update data
    const updateData = {
      firstName: firstName || player.firstName,
      lastName: lastName || player.lastName,
      fixLimit: currentLimit || player.fixLimit,
      agentBlocked:
        agentBlocked !== undefined ? agentBlocked : player.agentBlocked,
      betsBlocked: betsBlocked !== undefined ? betsBlocked : player.betsBlocked,
    };
    // Update allowed fields
    const updatedPlayer = await db
      .update(players)
      .set(updateData)
      .where({ id: playerId });

    // If no rows are updated, return an error
    if (updatedPlayer === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0046",
        message: "Failed to update player details",
        data: {},
      });
    }
    return res.status(200).json({
      uniqueCode: "CGP0043",
      message: "Player details updated successfully",
      data: {
        player: updateData,
      },
    });
  } catch (error) {
    logger.error("Error updating player details:", error);
    return res.status(500).json({
      uniqueCode: "CGP0044",
      message: "Error updating player details",
      data: { error },
    });
  }
};
