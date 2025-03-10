import { db } from "../../config/db.js";
import { users, players, agents, superAgents } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";
import { eq, and } from "drizzle-orm";

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, id = null } = req.body;
  let userId;

  if (id === null) userId = req.session.userId;
  else userId = id;

  try {
    if (!userId) {
      const unauthenticatedResponse = {
        uniqueCode: "CGP0026",
        message: "User not authenticated",
        data: { success: false },
      };
      logToFolderError(
        "Client/controller",
        "changePassword",
        unauthenticatedResponse
      );
      return res.status(401).json(unauthenticatedResponse);
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      const userNotFoundResponse = {
        uniqueCode: "CGP0027",
        message: "User not found",
        data: { success: false },
      };
      logToFolderError(
        "Client/controller",
        "changePassword",
        userNotFoundResponse
      );
      return res.status(404).json(userNotFoundResponse);
    }

    //Directly Compare Plain Text Passwords
    if (currentPassword !== user[0].password) {
      const incorrectPasswordResponse = {
        uniqueCode: "CGP0028",
        message: "Incorrect current password",
        data: { success: false },
      };
      logToFolderError(
        "Client/controller",
        "changePassword",
        incorrectPasswordResponse
      );
      return res.status(400).json(incorrectPasswordResponse);
    }

    // Prevent reusing the same password
    if (newPassword === user[0].password) {
      const samePasswordResponse = {
        uniqueCode: "CGP0031",
        message: "New password cannot be the same as the current password",
        data: { success: false },
      };
      logToFolderError(
        "Client/controller",
        "changePassword",
        samePasswordResponse
      );
      return res.status(400).json(samePasswordResponse);
    }

    // // Validate password strength
    // const passwordRegex =
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    // if (!passwordRegex.test(newPassword)) {
    //   return res.status(400).json({
    //     uniqueCode: "CGP0032",
    //     message:
    //       "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters",
    //     data: { success: false },
    //   });
    // }

    // Store Plain Text Password
    await db
      .update(users)
      .set({ password: newPassword }) // Storing password as plain text
      .where(eq(users.id, userId));

    const successResponse = {
      uniqueCode: "CGP0029",
      message: "Password changed successfully",
      data: { success: true },
    };
    logToFolderInfo("Client/controller", "changePassword", successResponse);
    return res.json(successResponse);
  } catch (error) {
    const errorResponse = {
      uniqueCode: "CGP0030",
      message: "Internal server error",
      data: { success: false, error: error.message },
    };
    logToFolderError("Client/controller", "changePassword", errorResponse);
    return res.status(500).json(errorResponse);
  }
};

// Agent changes client's password
export const changeClientPassword = async (req, res) => {
  const { newPassword, currentPassword, confirmPassword } = req.body;
  const agentId = req.session.userId;
  const { clientId } = req.params;

  try {
    // Verify the agent and client relationship
    const client = await db
      .select()
      .from(players)
      .innerJoin(agents, eq(players.agentId, agents.id))
      .where(and(eq(players.userId, clientId), eq(agents.userId, agentId)));

    if (client.length === 0) {
      return res.status(403).json({
        uniqueCode: "CGP0032",
        message: "Client not found or does not belong to this agent",
        data: { success: false },
      });
    }
    const agent = await db
      .select()
      .from(users)
      .where(eq(users.id, agentId))
      .limit(1);
    if (agent.length === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0208",
        message: "Agent not found",
        data: { success: false },
      });
    }

    if (currentPassword !== agent[0].password) {
      const incorrectPasswordResponse = {
        uniqueCode: "CGP0033",
        message: "Incorrect current password",
        data: { success: false },
      };
      logToFolderError(
        "Client/controller",
        "changePassword",
        incorrectPasswordResponse
      );
      return res.status(400).json(incorrectPasswordResponse);
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        uniqueCode: "CGP0209",
        message: "New password and confirm password do not match",
        data: { success: false },
      });
    }

    // Update client's password
    await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, clientId));

    return res.status(200).json({
      uniqueCode: "CGP0203",
      message: "Client password updated successfully",
      data: { success: true },
    });
  } catch (error) {
    return res.status(500).json({
      uniqueCode: "CGP0204",
      message: "Internal server error",
      data: { success: false, error: error.message },
    });
  }
};

// Super agent changes agent's password
export const changeAgentPassword = async (req, res) => {
  const { agentId, newPassword } = req.body;
  const superAgentId = req.session.userId;

  try {
    // Verify the super agent and agent relationship
    const agent = await db
      .select()
      .from(agents)
      .innerJoin(superAgents, eq(agents.superAgentId, superAgents.id))
      .where(
        and(eq(agents.userId, agentId), eq(superAgents.userId, superAgentId))
      );

    if (agent.length === 0) {
      return res.status(403).json({
        uniqueCode: "CGP0205",
        message: "Agent not found or does not belong to this super agent",
        data: { success: false },
      });
    }

    // Update agent's password
    await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, agentId));

    return res.status(200).json({
      uniqueCode: "CGP0206",
      message: "Agent password updated successfully",
      data: { success: true },
    });
  } catch (error) {
    return res.status(500).json({
      uniqueCode: "CGP0207",
      message: "Internal server error",
      data: { success: false, error: error.message },
    });
  }
};
