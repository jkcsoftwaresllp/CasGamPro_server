import { db } from "../../config/db.js";
import { eq } from "drizzle-orm";
import { agents, users } from "../../database/schema.js";

export const getAgentDashboard = async (req, res) => {
  try {
    const agentId = req.session.userId;
    console.log("agentId", agentId);
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, agentId));

    if (!agent) {
      return res.status(404).json({
        uniqueCode: "CGP0064",
        message: "Agent not found",
        data: {},
      });
    }
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, agent.userId));

    if (!user) {
      return res.status(404).json({
        uniqueCode: "CGP0067",
        message: "User associated with agent not found",
        data: {},
      });
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
        futureExpansion: [],
      },
    };

    return res.status(200).json({
      uniqueCode: "CGP0065",
      message: "Agent dashboard fetched successfully",
      data: {
        responseData,
      },
    });
  } catch (error) {
    console.error("Error fetching exposure data:", error);
    return res.status(500).json({
      uniqueCode: "CGP0066",
      message: "Internal Server Error",
      data: {},
    });
  }
};
