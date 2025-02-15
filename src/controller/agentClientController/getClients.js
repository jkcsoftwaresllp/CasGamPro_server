import { db } from "../../config/db.js";
import { eq } from "drizzle-orm";
import { agents, players, users } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

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

    // Retrieve the clients (players) managed by the agent
    const clients = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        matchShare: players.share,
        lotteryCommission: players.lotteryCommission,
        casinoCommission: players.casinoCommission,
      })
      .from(players)
      .innerJoin(users, eq(players.userId, users.id))
      .where(eq(players.agentId, agentResult.id));

    if (!clients.length) {
      let temp2 = {
        uniqueCode: "CGP0037",
        message: "No clients found for this agent",
        data: {},
      };
      logToFolderInfo("Agent/controller", "getClients", temp2);
      return res.status(200).json(temp2);
    }
    let temp3 = {
      uniqueCode: "CGP0038",
      message: "Clients retrieved successfully",
      data: { clients },
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
