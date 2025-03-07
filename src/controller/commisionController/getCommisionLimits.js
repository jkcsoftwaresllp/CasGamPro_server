import { db } from "../../config/db.js";
import { agents, players, users, superAgents } from "../../database/schema.js";
import { sql, eq, and } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";
import { filterUtils } from "../../utils/filterUtils.js";

export const getCommisionLimits = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { limit = 30, offset = 0 } = req.query;

    if (!userId) {
      const temp = {
        uniqueCode: "CGP0163",
        message: "Unauthorized",
        data: {},
      };
      logToFolderError("Commission/controller", "getCommisionLimits", temp);
      return res.status(401).json(temp);
    }

    // Ensure valid numeric limit and offset
    const recordsLimit = Math.min(parseInt(limit) || 30, 100);
    const recordsOffset = parseInt(offset) || 0;

    // Get filter conditions using filterUtils
    const filterConditions = filterUtils(req.query);

    // Fetch user role
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      const notFoundResponse = {
        uniqueCode: "CGP0162",
        message: "User not found",
        data: {},
      };
      logToFolderError(
        "Commission/controller",
        "getCommisionLimits",
        notFoundResponse
      );
      return res.status(404).json(notFoundResponse);
    }

    const { role } = user;
    let results = [];
    let totalRecordsQuery = [];

    if (role === "AGENT") {
      // Fetch agent details
      const [agentResult] = await db
        .select({ id: agents.id })
        .from(agents)
        .where(eq(agents.userId, userId));

      if (!agentResult) {
        const notAgentResponse = {
          uniqueCode: "CGP0161",
          message: "Not authorized as an agent",
          data: {},
        };
        logToFolderError(
          "Commission/controller",
          "getCommisionLimits",
          notAgentResponse
        );
        return res.status(403).json(notAgentResponse);
      }

      // Fetch commission limits for players under the agent
      results = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          share: players.share,
          casinoCommission: players.casinoCommission || 0,
          lotteryCommission: players.lotteryCommission || 0,
          currentLimit: players.balance || 0, // Current limit is same as balance
        })
        .from(players)
        .innerJoin(users, eq(players.userId, users.id))
        .where(and(eq(players.agentId, agentResult.id), ...filterConditions))
        .orderBy(players.id)
        .limit(recordsLimit)
        .offset(recordsOffset);

      totalRecordsQuery = await db
        .select({ count: sql`COUNT(*)` })
        .from(players)
        .innerJoin(users, eq(players.userId, users.id))
        .where(and(eq(players.agentId, agentResult.id), ...filterConditions));
    } else if (role === "SUPERAGENT") {
      // Fetch super agent details
      const [superAgentResult] = await db
        .select({ id: superAgents.id })
        .from(superAgents)
        .where(eq(superAgents.userId, userId));

      if (!superAgentResult) {
        const notSuperAgentResponse = {
          uniqueCode: "CGP0160",
          message: "Not authorized as a super agent",
          data: {},
        };
        logToFolderError(
          "Commission/controller",
          "getCommisionLimits",
          notSuperAgentResponse
        );
        return res.status(403).json(notSuperAgentResponse);
      }

      // Fetch commission limits for agents under the super agent
      results = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          share: agents.maxShare,
          casinoCommission: agents.maxCasinoCommission || 0,
          lotteryCommission: agents.maxLotteryCommission || 0,
          currentLimit: agents.balance || 0, // Current limit is same as balance
        })
        .from(agents)
        .innerJoin(users, eq(agents.userId, users.id))
        .where(
          and(eq(agents.superAgentId, superAgentResult.id), ...filterConditions)
        )
        .orderBy(agents.id)
        .limit(recordsLimit)
        .offset(recordsOffset);

      totalRecordsQuery = await db
        .select({ count: sql`COUNT(*)` })
        .from(agents)
        .innerJoin(users, eq(agents.userId, users.id))
        .where(
          and(eq(agents.superAgentId, superAgentResult.id), ...filterConditions)
        );
    } else {
      const unauthorizedResponse = {
        uniqueCode: "CGP0159",
        message: "User role not allowed",
        data: {},
      };
      logToFolderError(
        "Commission/controller",
        "getCommisionLimits",
        unauthorizedResponse
      );
      return res.status(403).json(unauthorizedResponse);
    }

    const totalRecords = parseInt(totalRecordsQuery[0]?.count) || 0;

    // Calculate next offset
    const nextOffset =
      recordsOffset + recordsLimit < totalRecords
        ? recordsOffset + recordsLimit
        : null;

    let response = {
      uniqueCode: "CGP0051",
      message: "Commission limits fetched successfully",
      data: { results, totalRecords, nextOffset },
    };

    logToFolderInfo("Commission/controller", "getCommisionLimits", response);
    return res.json(response);
  } catch (error) {
    let tempError = {
      uniqueCode: "CGP0052",
      message: "Internal Server Error",
      data: { error: error.message },
    };

    logToFolderError("Commission/controller", "getCommisionLimits", tempError);
    console.error("Error fetching commission limits:", error);
    return res.status(500).json(tempError);
  }
};
