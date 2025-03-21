import { db } from "../../config/db.js";
import { users, BLOCKING_LEVELS } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";
import { createResponse } from "../../helper/responseHelper.js";
import { logger } from "../../logger/logger.js";
import { getHierarchyUnderUser } from "../../database/queries/users/sqlGetUsers.js";

export const setBlocking = async (req, res) => {
  try {
    const { userId, blockingLevel } = req.body;
    const adminId = req.session.userId;

    // Validate input
    if (!userId || !blockingLevel) {
      return res.status(400).json(
        createResponse("error", "CGP0156", "User ID and blocking level are required")
      );
    }

    // Validate blocking level
    if (!BLOCKING_LEVELS.config.enumValues.includes(blockingLevel)) {
      return res.status(400).json(
        createResponse("error", "CGP0157", "Invalid blocking level")
      );
    }

    // Get requester's role and target user
    const [requester] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, adminId));

    if (!requester) {
      return res.status(401).json(
        createResponse("error", "CGP0158", "Unauthorized access")
      );
    }

    // Get hierarchy of users under the target user
    const hierarchy = await getHierarchyUnderUser(userId, requester.role);

    // Start transaction
    await db.transaction(async (tx) => {
      // Update target user's blocking level
      await tx
        .update(users)
        .set({ blocking_levels: blockingLevel })
        .where(eq(users.id, userId));

      // If there are players under this user, update them all in a single query
      if (hierarchy.players && hierarchy.players.length > 0) {
        await tx
          .update(users)
          .set({ blocking_levels: blockingLevel })
          .where(and(
            eq(users.role, "PLAYER"),
            users.id.in(hierarchy.players)
          ));
      }
    });

    return res.status(200).json(
      createResponse("success", "CGP0159", `User blocking status updated to ${blockingLevel}`, {
        userId,
        blockingLevel,
        affectedPlayers: hierarchy.players?.length || 0
      })
    );

  } catch (error) {
    logger.error("Error setting user block status:", error);
    return res.status(500).json(
      createResponse("error", "CGP0160", "Internal server error", { error: error.message })
    );
  }
};