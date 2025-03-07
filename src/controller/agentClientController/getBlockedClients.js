import { db } from "../../config/db.js";
import { eq, inArray, and } from "drizzle-orm";
import { agents, players, users, superAgents } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";
import { filterUtils } from "../../utils/filterUtils.js";

export const getBlockedClients = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      const temp = {
        uniqueCode: "CGP0068",
        message: "Unauthorized",
        data: {},
      };
      logToFolderError("Agent/controller", "getBlockedClients", temp);
      return res.status(401).json(temp);
    }

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      const notFoundResponse = {
        uniqueCode: "CGP0073",
        message: "User not found",
        data: {},
      };
      logToFolderError(
        "Agent/controller",
        "getBlockedClients",
        notFoundResponse
      );
      return res.status(404).json(notFoundResponse);
    }

    const { role } = user;
    let blockedEntities = [];

    // Base condition: Blocked users only (LEVEL_1, LEVEL_2, LEVEL_3)
    const baseBlockedCondition = inArray(users.blocking_levels, [
      "LEVEL_1",
      "LEVEL_2",
      "LEVEL_3",
    ]);

    // Apply additional filters using filterUtils
    const filterConditions = filterUtils(req.query);

    if (role === "AGENT") {
      // Check if the user is an agent
      const [agentResult] = await db
        .select({ id: agents.id })
        .from(agents)
        .where(eq(agents.userId, userId));

      if (!agentResult) {
        const notAgentResponse = {
          uniqueCode: "CGP0069",
          message: "Not authorized as an agent",
          data: {},
        };
        logToFolderError(
          "Agent/controller",
          "getBlockedClients",
          notAgentResponse
        );
        return res.status(403).json(notAgentResponse);
      }

      // Fetch blocked players under the agent
      blockedEntities = await db
        .select({
          id: users.id,
          username: users.username,
          lotteryCommission: players.lotteryCommission || 0,
          casinoCommission: players.casinoCommission || 0,
          share: players.share || 0,
        })
        .from(players)
        .innerJoin(users, eq(players.userId, users.id))
        .where(
          and(
            eq(players.agentId, agentResult.id),
            baseBlockedCondition,
            ...filterConditions
          )
        );
    } else if (role === "SUPERAGENT") {
      // Check if the user is a super agent
      const [superAgentResult] = await db
        .select({ id: superAgents.id })
        .from(superAgents)
        .where(eq(superAgents.userId, userId));

      if (!superAgentResult) {
        const notSuperAgentResponse = {
          uniqueCode: "CGP0074",
          message: "Not authorized as a super agent",
          data: {},
        };
        logToFolderError(
          "Agent/controller",
          "getBlockedClients",
          notSuperAgentResponse
        );
        return res.status(403).json(notSuperAgentResponse);
      }

      // Fetch blocked agents under the super agent
      blockedEntities = await db
        .select({
          id: users.id,
          username: users.username,
          maxLotteryCommission: agents.maxLotteryCommission || 0,
          maxCasinoCommission: agents.maxCasinoCommission || 0,
          share: agents.maxShare || 0,
        })
        .from(agents)
        .innerJoin(users, eq(agents.userId, users.id))
        .where(
          and(
            eq(agents.superAgentId, superAgentResult.id),
            baseBlockedCondition,
            ...filterConditions
          )
        );
    } else {
      const unauthorizedResponse = {
        uniqueCode: "CGP0075",
        message: "User role not allowed",
        data: {},
      };
      logToFolderError(
        "Agent/controller",
        "getBlockedClients",
        unauthorizedResponse
      );
      return res.status(403).json(unauthorizedResponse);
    }

    if (!blockedEntities.length) {
      const temp2 = {
        uniqueCode: "CGP0070",
        message: "No blocked clients or agents found",
        data: { results: [] },
      };
      logToFolderInfo("Agent/controller", "getBlockedClients", temp2);
      return res.status(200).json(temp2);
    }

    // Format response
    const formattedBlockedEntities = blockedEntities.map((entity) => ({
      id: entity.id,
      username: entity.username || "N/A",
      lotteryCommission: entity.lotteryCommission,
      casinoCommission: entity.casinoCommission,
      share: entity.share,
      actions: "View/Edit", // Placeholder, update as needed
    }));

    const response = {
      uniqueCode: "CGP0071",
      message: "Blocked clients or agents retrieved successfully",
      data: { results: formattedBlockedEntities },
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
