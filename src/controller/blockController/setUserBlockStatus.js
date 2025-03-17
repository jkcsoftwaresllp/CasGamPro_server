import { db } from "../../config/db.js";
import { users, BlockingLevels } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";
import { createResponse } from "../../helper/responseHelper.js";
import { logger } from "../../logger/logger.js";

export const setUserBlockStatus = async (req, res) => {
  try {
    const { userId, blockingLevel } = req.body;
    const adminId = req.session.userId;

    // Validate input
    if (!userId || !blockingLevel) {
      return res.status(400).json(
        createResponse("error", "CGP0058", "User ID and blocking level are required")
      );
    }

    // Validate blocking level
    if (!BlockingLevels.config.enumValues.includes(blockingLevel)) {
      return res.status(400).json(
        createResponse("error", "CGP0059", "Invalid blocking level")
      );
    }

    // Check if the user exists and is under the admin's control
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.parent_id, adminId)
      ));

    if (!user) {
      return res.status(404).json(
        createResponse("error", "CGP0060", "User not found or not under your control")
      );
    }

    // Update user's blocking level
    await db
      .update(users)
      .set({ blocking_levels: blockingLevel })
      .where(eq(users.id, userId));

    return res.status(200).json(
      createResponse("success", "CGP0061", `User blocking status updated to ${blockingLevel}`, {
        userId,
        blockingLevel,
      })
    );

  } catch (error) {
    logger.error("Error setting user block status:", error);
    return res.status(500).json(
      createResponse("error", "CGP0062", "Internal server error", { error: error.message })
    );
  }
};