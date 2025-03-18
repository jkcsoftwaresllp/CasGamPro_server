import { db } from "../config/db.js";
import { users, user_limits_commissions } from "../database/schema.js";
import { eq } from "drizzle-orm";
import { generateUserId } from "../utils/generateUserId.js";
import { logToFolderError, logToFolderInfo } from "../utils/logToFolder.js";
import { createResponse } from "../helper/responseHelper.js";
import { logger } from "../logger/logger.js";

export const generateUserCommission = async (req, res) => {
  try {
    const parentId = req.session.userId;

    // Get parent user with their commission limits
    const [parentData] = await db
      .select({
        user: users,
        limits: user_limits_commissions,
      })
      .from(users)
      .leftJoin(
        user_limits_commissions,
        eq(users.id, user_limits_commissions.user_id)
      )
      .where(eq(users.id, parentId));

    if (!parentData) {
      const errorResponse = createResponse(
        "error",
        "CGP0106",
        "Parent user not found or unauthorized"
      );
      logToFolderError(
        "General/controller",
        "generateUserCommission",
        errorResponse
      );
      return res.status(403).json(errorResponse);
    }

    const { user: parent, limits: parentLimits } = parentData;

    // Generate a unique user ID based on the provided first name
    const { firstName } = req.body;
    if (!firstName) {
      return res.status(400).json(
        createResponse("error", "CGP0107", "First name is required")
      );
    }

    const newUserId = generateUserId(firstName);

    const successResponse = createResponse(
      "success",
      "CGP0108",
      "User ID generated and limits retrieved",
      {
        userId: newUserId,
        maxShare: parentLimits?.max_share || 0,
        maxCasinoCommission: parentLimits?.max_casino_commission || 0,
        maxLotteryCommission: parentLimits?.max_lottery_commission || 0,
        maxSessionCommission: parentLimits?.max_session_commission || 0,
        minBet: parentLimits?.min_bet || 0,
        maxBet: parentLimits?.max_bet || 0,
      }
    );

    logToFolderInfo(
      "General/controller",
      "generateUserCommission",
      successResponse
    );

    return res.status(200).json(successResponse);
  } catch (error) {
    logger.error("Error in generateUserCommission:", error);
    const errorResponse = createResponse(
      "error",
      "CGP0109",
      "Internal server error",
      { error: error.message }
    );

    logToFolderError(
      "General/controller",
      "generateUserCommission",
      errorResponse
    );
    return res.status(500).json(errorResponse);
  }
};