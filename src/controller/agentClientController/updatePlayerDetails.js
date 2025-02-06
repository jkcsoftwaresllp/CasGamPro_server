import { db } from "../../config/db.js";
import { agents, players, users } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const updatePlayerDetails = async (req, res) => {
  const agentId = req.session.userId;

  const { playerId } = req.params;
  const { firstName, lastName, currentLimit, agentBlocked, betsBlocked } =
    req.body;

  try {
    // Check if the logged-in user is an agent
    const [agent] = await db.select().from(agents).where({ userId: agentId });
    if (!agent) {
      let temp14 = {
        uniqueCode: "CGP0047",
        message: "Not authorized as agent",
        data: {},
      };
      logToFolderError("Agent/controller", "updatePlayerDetails", temp14);
      return res.status(403).json(temp14);
    }

    // Find the player
    const [player] = await db.select().from(players).where({ id: playerId });
    if (!player) {
      let temp15 = {
        uniqueCode: "CGP0041",
        message: "Player not found",
        data: {},
      };
      logToFolderError("Agent/controller", "updatePlayerDetails", temp15);
      return res.status(404).json(temp15);
    }

    // Check if the player is under the agent's management
    if (player.agentId !== agent.id) {
      let temp16 = {
        uniqueCode: "CGP0042",
        message: "You can only edit players under your management",
        data: {},
      };
      logToFolderError("Agent/controller", "updatePlayerDetails", temp16);
      return res.status(403).json(temp16);
    }
    // Validate fields if needed
    if (currentLimit && isNaN(currentLimit)) {
      let temp17 = {
        uniqueCode: "CGP0045",
        message: "Current Limit should be a valid number",
        data: {},
      };
      logToFolderError("Agent/controller", "updatePlayerDetails", temp17);
      return res.status(400).json(temp17);
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
      let temp18 = {
        uniqueCode: "CGP0046",
        message: "Failed to update player details",
        data: {},
      };
      logToFolderError("Agent/controller", "updatePlayerDetails", temp18);
      return res.status(404).json(temp18);
    }

    let temp19 = {
      uniqueCode: "CGP0043",
      message: "Player details updated successfully",
      data: { player: updateData },
    };
    logToFolderInfo("Agent/controller", "updatePlayerDetails", temp19);

    return res.status(200).json(temp19);
  } catch (error) {
    let temp20 = {
      uniqueCode: "CGP0044",
      message: "Error updating player details",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "updatePlayerDetails", temp20);
    return res.status(500).json(temp20);
  }
};
