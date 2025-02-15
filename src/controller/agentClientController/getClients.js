import { db } from "../../config/db.js";
import { eq, and } from "drizzle-orm";
import { agents, players, users } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";
import { filterUtils } from "../../utils/filterUtils.js";

export const getClients = async (req, res) => {
  try {
    const agentId = req.session.userId;

    if (!agentId) {
      let temp = {
        uniqueCode: "CGP0040",
        message: "Unauthorized",
        data: {},
      };
      logToFolderError("Agent/controller", "getClients", temp);
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
        uniqueCode: "CGP0036",
        message: "Not authorized as agent",
        data: {},
      };
      logToFolderError("Agent/controller", "getClients", notAgentResponse);
      return res.status(403).json(notAgentResponse);
    }
    // Build filter conditions
    const conditions = filterUtils({ ...req.query, agentId: agentResult.id });

    // Retrieve the clients (players) managed by the agent
    const clients = await db
      .select({
        id: users.id,
        username: users.username,
        matchCommission: players.casinoCommission, // TODO
        lotteryCommission: players.lotteryCommission,
        share: players.share,
      })
      .from(players)
      .innerJoin(users, eq(players.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    if (!clients.length) {
      let temp2 = {
        uniqueCode: "CGP0037",
        message: "No clients found for this agent",
        data: {},
      };
      logToFolderInfo("Agent/controller", "getClients", temp2);
      return res.status(200).json(temp2);
    }
    // Format response to match the required column structure
    const formattedClients = clients.map((client) => ({
      id: client.id,
      username: client.username || "N/A",
      matchCommission: client.matchCommission || 0,
      lotteryCommission: client.lotteryCommission || 0,
      share: client.share || 0,
      actions: "View/Edit",
    }));
    let temp3 = {
      uniqueCode: "CGP0038",
      message: "Clients retrieved successfully",
      data: { formattedClients },
    };
    logToFolderInfo("Agent/controller", "getClients", temp3);
    return res.status(200).json(temp3);
  } catch (error) {
    console.log(error);
    let temp4 = {
      uniqueCode: "CGP0039",
      message: "Internal server error",
      data: { error: error.message },
    };

    logToFolderError("Agent/controller", "getClients", temp4);
    return res.status(500).json(temp4);
  }
};
