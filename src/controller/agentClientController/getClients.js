import { db } from "../../config/db.js";
import { eq, and, inArray } from "drizzle-orm";
import { agents, players, users, superAgents } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";
import { filterUtils } from "../../utils/filterUtils.js";

export const getClients = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { limit = 30, offset = 0 } = req.query;

    if (!userId) {
      let temp = {
        uniqueCode: "CGP0040",
        message: "Unauthorized",
        data: {},
      };
      logToFolderError("Agent/controller", "getClients", temp);
      return res.status(401).json(temp);
    }

    // Check if the user is an agent
    const agentResult = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, userId))
      .then((res) => res[0]);

    // Check if the user is a super agent
    const superAgentResult = await db
      .select()
      .from(superAgents)
      .where(eq(superAgents.userId, userId))
      .then((res) => res[0]);

    let clients = [];

    // Ensure valid numeric limit and offset
    const recordsLimit = Math.min(parseInt(limit) || 30, 100);
    const recordsOffset = parseInt(offset) || 0;

    // const conditions = filterUtils({ ...req.query, agentId: agentResult.id });
    const conditions = filterUtils({ ...req.query }); // TODO : Fix Filter

    if (agentResult) {
      // The user is an agent, fetch their players

      clients = await db
        .select({
          id: users.id,
          userName: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          lotteryCommission: players.lotteryCommission,
          casinoCommission: players.casinoCommission,
          matchShare: players.share,
        })
        .from(players)
        .innerJoin(users, eq(players.userId, users.id))
        .where(and(eq(players.agentId, agentResult.id), ...conditions))
        .orderBy(players.id)
        .limit(recordsLimit)
        .offset(recordsOffset);
    } else if (superAgentResult) {
      // The user is a super agent, fetch agents under them
      const agentsUnderSuperAgent = await db
        .select({
          id: agents.userId,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          lotteryCommission: agents.maxLotteryCommission,
          casinoCommission: agents.maxCasinoCommission,
          matchShare: agents.maxShare,
        })
        .from(agents)
        .innerJoin(users, eq(agents.userId, users.id))
        .where(eq(agents.superAgentId, superAgentResult.id));

      clients = [...agentsUnderSuperAgent];
    } else {
      const notAgentOrSuperAgentResponse = {
        uniqueCode: "CGP0036",
        message: "Not authorized as agent or super agent",
        data: {},
      };
      logToFolderError(
        "Agent/controller",
        "getClients",
        notAgentOrSuperAgentResponse
      );
      return res.status(403).json(notAgentOrSuperAgentResponse);
    }

    if (!clients.length) {
      let temp2 = {
        uniqueCode: "CGP0037",
        message: "No clients found",
        data: { results: [] },
      };
      logToFolderInfo("Agent/controller", "getClients", temp2);
      return res.status(200).json(temp2);
    }

    let temp3 = {
      uniqueCode: "CGP0038",
      message: "Clients retrieved successfully",
      data: { results: clients },
    };
    logToFolderInfo("Agent/controller", "getClients", temp3);
    return res.status(200).json(temp3);
  } catch (error) {
    console.error(error);
    let temp4 = {
      uniqueCode: "CGP0039",
      message: "Internal server error",
      data: { error: error.message },
    };

    logToFolderError("Agent/controller", "getClients", temp4);
    return res.status(500).json(temp4);
  }
};
