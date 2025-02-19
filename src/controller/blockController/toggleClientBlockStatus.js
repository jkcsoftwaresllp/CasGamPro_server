import { db } from "../../config/db.js";
import { players, users, agents } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";

import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const toggleClientBlocking = async (req, res) => {
  try {
    const { clientId } = req.body;
    const agentId = req.session.userId;

    // Validate input
    if (!agentId || !clientId) {
      let errorLog = {
        uniqueCode: "CGP0117",
        message: "Agent ID and client ID are required",
        data: {},
      };
      logToFolderError("Agent/controller", "toggleClientBlocking", errorLog);
      return res.status(400).json(errorLog);
    }

    // Check if the player exists under the agent
    const player = await db
      .select()
      .from(players)
      .innerJoin(agents, eq(players.agentId, agents.id))
      .where(and(eq(players.userId, clientId), eq(agents.userId, agentId)));

    if (player.length === 0) {
      let errorLog = {
        uniqueCode: "CGP0119",
        message: "Client not found under this agent",
        data: {},
      };
      logToFolderError("Agent/controller", "toggleClientBlocking", errorLog);
      return res.status(404).json(errorLog);
    }

    // Fetch current blocking level
    const user = await db.select().from(users).where(eq(users.id, clientId));

    if (user.length === 0) {
      let errorLog = {
        uniqueCode: "CGP0122",
        message: "User not found",
        data: {},
      };
      logToFolderError("Agent/controller", "toggleClientBlocking", errorLog);
      return res.status(404).json(errorLog);
    }

    const currentBlockingLevel = user[0].blocking_levels;

    // Toggle LEVEL_1 only
    const newBlockingLevel =
      currentBlockingLevel === "LEVEL_1" ? "NONE" : "LEVEL_1";

    // Update user's blocking level
    await db
      .update(users)
      .set({ blocking_levels: newBlockingLevel })
      .where(eq(users.id, clientId));

    let successLog = {
      uniqueCode: "CGP0120",
      message: `Client blocking status updated to ${newBlockingLevel}`,
      data: { clientId, newBlockingLevel },
    };
    logToFolderInfo("Agent/controller", "toggleClientBlocking", successLog);

    return res.status(200).json(successLog);
  } catch (error) {
    let errorLog = {
      uniqueCode: "CGP0121",
      message: "Internal server error",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "toggleClientBlocking", errorLog);
    return res.status(500).json(errorLog);
  }
};
