import { db } from "../../config/db.js";
import { eq } from "drizzle-orm";
import { agents, users, superAgents } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const getDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Fetch user details
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      let temp = {
        uniqueCode: "CGP0067",
        message: "User not found",
        data: {},
      };
      logToFolderError("Dashboard/controller", "getDashboard", temp);
      return res.status(404).json(temp);
    }

    let responseData = [];

    if (user.role === "AGENT") {
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.userId, userId));

      if (!agent) {
        let temp = {
          uniqueCode: "CGP0064",
          message: "Agent not found",
          data: {},
        };
        logToFolderError("Dashboard/controller", "getDashboard", temp);
        return res.status(404).json(temp);
      }

      responseData = [
        { label: "My User Name", value: user.username },
        { label: "My Name", value: `${user.firstName} ${user.lastName}` },
        { label: "Access level", value: user.role },
        { label: "Fix Limit", value: agent.balance },
        { label: "Company Contact", value: `MGR${agent.superAgentId}` },
        { label: "Maximum My Share", value: agent.maxShare },
        { label: "Minimum Company Share", value: 100 - agent.maxShare },
        { label: "Casino Commission", value: agent.maxCasinoCommission },
        { label: "Lottery Commission", value: agent.maxLotteryCommission },
      ];
    } else if (user.role === "SUPERAGENT") {
      const [superAgent] = await db
        .select()
        .from(superAgents)
        .where(eq(superAgents.userId, userId));

      if (!superAgent) {
        let temp = {
          uniqueCode: "CGP0070",
          message: "Super Agent not found",
          data: {},
        };
        logToFolderError("Dashboard/controller", "getDashboard", temp);
        return res.status(404).json(temp);
      }

      // Fetch data from the agents table for the SuperAgent
      const [agentData] = await db
        .select()
        .from(agents)
        .where(eq(agents.superAgentId, superAgent.id));

      responseData = [
        { label: "My User Name", value: user.username },
        { label: "My Name", value: `${user.firstName} ${user.lastName}` },
        { label: "Access level", value: user.role },
        { label: "Minimum Bet", value: superAgent.minBet },
        { label: "Maximum Bet", value: superAgent.maxBet },
        { label: "Maximum My Share", value: agentData?.maxShare ?? "N/A" },
        {
          label: "Minimum Company Share",
          value: agentData ? 100 - agentData.maxShare : "N/A",
        },
        {
          label: "Casino Commission",
          value: agentData?.maxCasinoCommission ?? "N/A",
        },
        {
          label: "Lottery Commission",
          value: agentData?.maxLotteryCommission ?? "N/A",
        },
      ];
    } else {
      let temp = {
        uniqueCode: "CGP0071",
        message: "Access Denied",
        data: {},
      };
      logToFolderError("Dashboard/controller", "getDashboard", temp);
      return res.status(403).json(temp);
    }

    let temp = {
      uniqueCode: "CGP0065",
      message: "Dashboard fetched successfully",
      data: responseData,
    };

    logToFolderInfo("Dashboard/controller", "getDashboard", temp);
    return res.status(200).json(temp);
  } catch (error) {
    let temp = {
      uniqueCode: "CGP0066",
      message: "Internal Server Error",
      data: {},
    };
    logToFolderError("Dashboard/controller", "getDashboard", temp);
    return res.status(500).json(temp);
  }
};
