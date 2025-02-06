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
      logToFolderError("client/controller", "getClients", temp);
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
      logToFolderError("client/controller", "getClients", notAgentResponse);
      return res.status(403).json(notAgentResponse);
    }

    // Retrieve the clients (players) managed by the agent
    const clients = await db
      .select({
        id: players.id,
        firstName: users.firstName,
        lastName: users.lastName,
        fixLimit: players.fixLimit,
        blocked: users.blocking_levels,
        //betsBlocked: players.betsBlocked,
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
      logToFolderInfo("client/controller", "getClients", temp2);
      return res.status(200).json(temp2);
    }
    let temp3 = {
      uniqueCode: "CGP0038",
      message: "Clients retrieved successfully",
      data: { clients },
    };
    logToFolderInfo("client/controller", "getClients", temp3);
    return res.status(200).json(temp3);
  } catch (error) {
    let temp4 = {
      uniqueCode: "CGP0039",
      message: "Internal server error",
      data: { error: error.message },
    };

    logToFolderError("client/controller", "getClients", temp4);
    return res.status(500).json(temp4);
  }
};
