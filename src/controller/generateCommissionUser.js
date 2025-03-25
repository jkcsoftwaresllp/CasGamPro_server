import { db } from "../config/db.js";
import { users, user_limits_commissions } from "../database/schema.js";
import { eq } from "drizzle-orm";
import { generateUserId } from "../utils/generateUserId.js";
import { logToFolderError, logToFolderInfo } from "../utils/logToFolder.js";
import { createResponse } from "../helper/responseHelper.js";
import { logger } from "../logger/logger.js";

export const generateUserCommission = async (req, res) => {
  try {
    const ownerId = req.session.userId;
    const ownerName = req.session.clientName;

    const columns = {
      ownerLimit: user_limits_commissions,
      userName: users.first_name,
      maxShare: user_limits_commissions.max_share,
      maxCasinoCommission: user_limits_commissions.max_casino_commission,
      maxLotteryCommission: user_limits_commissions.max_lottery_commission,
      maxSessionCommission: user_limits_commissions.max_session_commission,
      minBet: user_limits_commissions.min_bet,
      maxBet: user_limits_commissions.max_bet,
    };

    // Get parent user with their commission limits
    const [ownerData] = await db
      .select(columns)
      .from(users)
      .innerJoin(
        user_limits_commissions,
        eq(users.id, user_limits_commissions.user_id)
      )
      .where(eq(users.id, ownerId));

    // if (!ownerData) {
    //   const errorResponse = createResponse(
    //     "error",
    //     "CGP0106",
    //     "Parent user not found or unauthorized"
    //   );
    //   logToFolderError(
    //     "General/controller",
    //     "generateUserCommission",
    //     errorResponse
    //   );
    //   return res.status(403).json(errorResponse);
    // }

    const newUserId = generateUserId(ownerName);

    const successResponse = createResponse(
      "success",
      "CGP0108",
      "User ID generated and limits retrieved",
      {
        userId: newUserId,
        maxShare: 100,
        maxCasinoCommission: 40,
        maxLotteryCommission: 40,
        maxSessionCommission: 40,
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
