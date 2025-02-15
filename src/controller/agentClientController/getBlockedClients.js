import { db } from "../../config/db.js";
import { eq, inArray } from "drizzle-orm";
import { agents, players, users } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const getBlockedClients = async (req, res) => {
  try {
    const agentId = req.session.userId;

    if (!agentId) {
      let temp = {
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

    // Retrieve the blocked clients (players) managed by the agent
    const blockedClients = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        fixLimit: players.fixLimit,
        blocked: users.blocking_levels,
      })
      .from(players)
      .innerJoin(users, eq(players.userId, users.id))
      .where(eq(players.agentId, agentResult.id))
      .where(inArray(users.blocking_levels, ["LEVEL_1", "LEVEL_2", "LEVEL_3"]));

    if (!blockedClients.length) {
      let temp2 = {
        uniqueCode: "CGP0070",
        message: "No blocked clients found for this agent",
        data: [],
      };
      logToFolderInfo("Agent/controller", "getBlockedClients", temp2);
      return res.status(200).json(temp2);
    }

    let temp3 = {
      uniqueCode: "CGP0071",
      message: "Blocked clients retrieved successfully",
      data: blockedClients,
    };
    logToFolderInfo("Agent/controller", "getBlockedClients", temp3);
    return res.status(200).json(temp3);
  } catch (error) {
    let temp4 = {
      uniqueCode: "CGP0072",
      message: "Internal server error",
      data: { error: error.message },
    };

    logToFolderError("Agent/controller", "getBlockedClients", temp4);
    return res.status(500).json(temp4);
  }
};
