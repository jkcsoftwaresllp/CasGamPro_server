import { db } from "../../config/db.js";
import { eq } from "drizzle-orm";
import { agents, users } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const getAgentDashboard = async (req, res) => {
  try {
    const agentId = req.session.userId;
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, agentId));

    if (!agent) {
      let temp = {
        uniqueCode: "CGP0064",
        message: "Agent not found",
        data: {},
      };
      logToFolderError("Agent/controller", "getAdminDashboard", temp);
      return res.status(404).json(temp);
    }
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, agent.userId));

    if (!user) {
      let temp = {
        uniqueCode: "CGP0067",
        message: "User associated with agent not found",
        data: {},
      };
      logToFolderError("Agent/controller", "getAdminDashboard", temp);
      return res.status(404).json(temp);
    }
    const responseData = {
      agentInfo: {
        username: user.username,
        userId: `AGT${user.id}`,
        accessLevel: user.role,
        fixLimit: agent.fixLimit,
        companyContact: `MGR${agent.superAgentId}`,
      },
      earningsOverview: {
        maximumMyShare: agent.maxShare,
        minimumCompanyShare: 100 - agent.maxShare,
      },
      commissionDetails: {
        casinoCommission: agent.maxCasinoCommission,
        lotteryCommission: agent.maxLotteryCommission,
        futureExpansion: [], //TODO
      },
    };
    let temp = {
      uniqueCode: "CGP0065",
      message: "Agent dashboard fetched successfully",
      data: {
        responseData,
      },
    };

    logToFolderInfo("Agent/controller", "getAdminDashboard", temp);
    return res.status(200).json(temp);
  } catch (error) {
    let temp = {
      uniqueCode: "CGP0066",
      message: "Internal Server Error",
      data: {},
    };
    logToFolderError("Agent/controller", "getAdminDashboard", temp);

    return res.status(500).json(temp);
  }
};
