import { db } from "../../config/db.js";
import { eq, inArray, and } from "drizzle-orm";
import { users, user_limits_commissions } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";
import { filterUtils } from "../../utils/filterUtils.js";

export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      const errorResponse = {
        uniqueCode: "CGP0068",
        message: "Unauthorized",
        data: {},
      };
      logToFolderError("User/controller", "getBlockedUsers", errorResponse);
      return res.status(401).json(errorResponse);
    }

    // Fetch user details
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      const notFoundResponse = {
        uniqueCode: "CGP0073",
        message: "User not found",
        data: {},
      };
      logToFolderError("User/controller", "getBlockedUsers", notFoundResponse);
      return res.status(404).json(notFoundResponse);
    }

    // Define the blocked condition
    const blockedCondition = inArray(users.blocking_levels, ["LEVEL_1", "LEVEL_2", "LEVEL_3"]);

    // Apply additional filters
    const filterConditions = filterUtils(req.query);

    // Fetch all blocked users under the given userId hierarchy, including commission details
    const blockedUsers = await db
      .select({
        id: users.id,
        username: users.first_name,
        role: users.role,
        maxLotteryCommission: user_limits_commissions.max_lottery_commission,
        maxCasinoCommission: user_limits_commissions.max_casino_commission,
        share: user_limits_commissions.max_share,
      })
      .from(users)
      .leftJoin(user_limits_commissions, eq(users.id, user_limits_commissions.user_id))
      .where(and(eq(users.parent_id, userId), blockedCondition, ...filterConditions));

    if (!blockedUsers.length) {
      const noBlockedUsersResponse = {
        uniqueCode: "CGP0070",
        message: "No blocked users found",
        data: { results: [] },
      };
      logToFolderInfo("User/controller", "getBlockedUsers", noBlockedUsersResponse);
      return res.status(200).json(noBlockedUsersResponse);
    }

    // Format response
    const formattedBlockedUsers = blockedUsers.map((user) => ({
      id: user.id,
      username: user.username || "N/A",
      role: user.role,
      maxLotteryCommission: user.maxLotteryCommission || 0,
      maxCasinoCommission: user.maxCasinoCommission || 0,
      share: user.share || 0,
      actions: "View/Edit",
    }));

    const successResponse = {
      uniqueCode: "CGP0071",
      message: "Blocked users retrieved successfully",
      data: { results: formattedBlockedUsers },
    };
    logToFolderInfo("User/controller", "getBlockedUsers", successResponse);
    return res.status(200).json(successResponse);
  } catch (error) {
    const errorResponse = {
      uniqueCode: "CGP0072",
      message: "Internal server error",
      data: { error: error.message },
    };
    logToFolderError("User/controller", "getBlockedUsers", errorResponse);
    return res.status(500).json(errorResponse);
  }
};
