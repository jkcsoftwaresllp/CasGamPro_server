import { db } from "../../config/db.js";
import { eq, inArray, and } from "drizzle-orm";
import { agents, players, users } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";
import { filterUtils } from "../../utils/filterUtils.js";

export const getBlockedClients = async (req, res) => {
  try {
    const agentId = req.session.userId;

    if (!agentId) {
      const temp = {
        uniqueCode: "CGP0068",
        message: "Unauthorized",
        data: {},
      };
      logToFolderError("Agent/controller", "getBlockedClients", temp);
      return res.status(401).json(temp);
    }

    // Check if the logged-in user is an agent
    const agentResult = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, agentId))
      .then((res) => res[0]);

    if (!agentResult) {
      const notAgentResponse = {
        uniqueCode: "CGP0069",
        message: "Not authorized as agent",
        data: {},
      };
      logToFolderError(
        "Agent/controller",
        "getBlockedClients",
        notAgentResponse
      );
      return res.status(403).json(notAgentResponse);
    }

    // Apply additional filters using filterUtils
    const baseConditions = [
      eq(players.agentId, agentResult.id),
      inArray(users.blocking_levels, ["LEVEL_1", "LEVEL_2", "LEVEL_3"]),
    ];

    const filterConditions = filterUtils(req.query); // Extract filters from request
    const finalConditions = and(...baseConditions, ...filterConditions);

    // Retrieve the blocked clients (players) managed by the agent
    const blockedClients = await db
      .select({
        id: users.id,
        username: users.username,
        matchCommission: players.casinoCommission || 0,
        sessionCommission: players.sessionCommission || 0,
        share: players.share || 0,
      })
      .from(players)
      .innerJoin(users, eq(players.userId, users.id))
      .where(finalConditions);

    if (!blockedClients.length) {
      const temp2 = {
        uniqueCode: "CGP0070",
        message: "No blocked clients found for this agent",
        data: [],
      };
      logToFolderInfo("Agent/controller", "getBlockedClients", temp2);
      return res.status(200).json(temp2);
    }

    // Format response to match the required column structure
    const formattedBlockedClients = blockedClients.map((client) => ({
      id: client.id,
      username: client.username || "N/A",
      matchCommission: client.matchCommission,
      sessionCommission: client.sessionCommission,
      share: client.share,
      actions: "View/Edit", // Placeholder, update as needed
    }));

    const response = {
      uniqueCode: "CGP0071",
      message: "Blocked clients retrieved successfully",
      data: formattedBlockedClients,
    };

    logToFolderInfo("Agent/controller", "getBlockedClients", response);
    return res.status(200).json(response);
  } catch (error) {
    const temp4 = {
      uniqueCode: "CGP0072",
      message: "Internal server error",
      data: { error: error.message },
    };

    logToFolderError("Agent/controller", "getBlockedClients", temp4);
    return res.status(500).json(temp4);
  }
};
