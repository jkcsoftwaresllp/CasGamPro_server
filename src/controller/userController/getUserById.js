import { db } from "../../config/db.js";
import { users, user_limits_commissions } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const getUserById = async (reqOrUserId, res = null) => {
  try {
    let userId;

    // Check if first argument is a request object or just an ID
    if (typeof reqOrUserId === "object" && reqOrUserId.params) {
      userId = reqOrUserId.params.id;
    } else {
      userId = reqOrUserId;
    }

    if (!userId) {
      let temp = {
        uniqueCode: "CGP0111",
        message: "Invalid user ID",
        data: { userId: reqOrUserId.params ? reqOrUserId.params.id : userId },
      };
      logToFolderError("User/controller", "getUserById", temp);
      
      if (res) return res.status(400).json(temp);
      return null;
    }

    // Fetch user details
    const user = await db
      .select({
        id: users.id,
        username: users.id,
        firstName: users.first_name,
        lastName: users.last_name,
        role: users.role,
        blockingLevels: users.blocking_levels,
        createdAt: users.created_at,
        fixLimit: users.balance,
        maxShare: user_limits_commissions.max_share,
        maxLotteryCommission: user_limits_commissions.max_lottery_commission,
        maxCasinoCommission: user_limits_commissions.max_casino_commission,
        maxSessionCommission: user_limits_commissions.max_session_commission,
      })
      .from(users)
      .leftJoin(user_limits_commissions, eq(users.id, user_limits_commissions.user_id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      let temp = {
        uniqueCode: "CGP0112",
        message: "User not found",
        data: { userId },
      };
      logToFolderError("User/controller", "getUserById", temp);
      
      if (res) return res.status(404).json(temp);
      return null;
    }

    let temp = {
      uniqueCode: "CGP0113",
      message: "User fetched successfully",
      data: user[0],
    };

    logToFolderInfo("User/controller", "getUserById", temp);
    
    if (res) return res.status(200).json(temp);
    return user[0];
  } catch (error) {
    console.error(error);
    let temp = {
      uniqueCode: "CGP0114",
      message: "Internal Server Error",
      data: { error: error.message },
    };
    logToFolderError("User/controller", "getUserById", temp);
    
    if (res) return res.status(500).json(temp);
    return null;
  }
};
