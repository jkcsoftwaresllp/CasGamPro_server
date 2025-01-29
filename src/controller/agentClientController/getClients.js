import { db } from "../../config/db.js";
import { eq } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { agents, players, users } from "../../database/schema.js";

export const getClients = async (req, res) => {
  try {
    const agentId = req.session.userId;

    if (!agentId) {
      return res.status(401).json({
        uniqueCode: "CGP0040",
        message: "Unauthorized: Agent ID missing in session.",
        data: {},
      });
    }
    // Check if the logged-in user is an agent
    const [agent] = await db.select().from(agents).where({ userId: agentId });
    if (!agent) {
      return res.status(403).json({
        uniqueCode: "CGP0036",
        message: "Not authorized as agent",
        data: {},
      });
    }

    // Retrieve the clients (players) managed by the agent
    const clients = await db
      .select({
        id: players.id,
        firstName: users.firstName,
        lastName: users.lastName,
        fixLimit: players.fixLimit,
        blocked: users.blocked,
        //betsBlocked: players.betsBlocked,
      })
      .from(players)
      .innerJoin(users, eq(players.userId, users.id))
      .where(eq(players.agentId, agent.id));

    if (!clients.length) {
      return res.status(200).json({
        uniqueCode: "CGP0037",
        message: "No clients found for this agent",
        data: {},
      });
    }

    return res.status(200).json({
      uniqueCode: "CGP0038",
      message: "Clients retrieved successfully",
      data: { clients },
    });
  } catch (error) {
    logger.error("Error retrieving clients:", error);
    return res.status(500).json({
      uniqueCode: "CGP0039",
      message: "Internal server error",
      data: {},
    });
  }
};
