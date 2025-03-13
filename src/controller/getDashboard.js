import { db } from "../config/db.js";
import { eq } from "drizzle-orm";
import { users, user_limits_commissions } from "../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../utils/logToFolder.js";
import { createResponse } from "../helper/responseHelper.js";

export const getDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      const errorResponse = createResponse("error", "CGP0013", "Unauthorized");
      logToFolderError("Dashboard/controller", "getDashboard", errorResponse);
      return res.status(401).json(errorResponse);
    }

    // Fetch user details with their limits and commissions
    const [userData] = await db
      .select({
        user: users,
        limits: user_limits_commissions,
      })
      .from(users)
      .leftJoin(
        user_limits_commissions,
        eq(users.id, user_limits_commissions.user_id)
      )
      .where(eq(users.id, userId))
      .execute();

    if (!userData) {
      const errorResponse = createResponse("error", "CGP0014", "User not found");
      logToFolderError("Dashboard/controller", "getDashboard", errorResponse);
      return res.status(404).json(errorResponse);
    }

    const { user, limits } = userData;

    // Get parent user info if exists
    let parentUser = null;
    if (user.parent_id) {
      [parentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.parent_id))
        .execute();
    }

    // Build response based on role
    let responseData = [];

    // Common data for all roles
    responseData.push(
      { label: "My User Name", value: user.username },
      { label: "My Name", value: `${user.first_name} ${user.last_name || ''}`.trim() },
      { label: "Access Level", value: user.role }
    );

    switch (user.role) {
      case "PLAYER":
        responseData.push(
          { label: "Balance", value: user.balance || 0 },
          { label: "Agent", value: parentUser?.username || "N/A" },
          { label: "Min Bet", value: limits?.min_bet || 0 },
          { label: "Max Bet", value: limits?.max_bet || 0 }
        );
        break;

      case "AGENT":
        responseData.push(
          { label: "Balance", value: user.balance || 0 },
          { label: "Super Agent", value: parentUser?.username || "N/A" },
          { label: "Maximum Share", value: limits?.max_share || 0 },
          { label: "Minimum Company Share", value: limits?.max_share ? 100 - limits.max_share : 0 },
          { label: "Casino Commission", value: limits?.max_casino_commission || 0 },
          { label: "Lottery Commission", value: limits?.max_lottery_commission || 0 },
          { label: "Session Commission", value: limits?.max_session_commission || 0 }
        );
        break;

      case "SUPERAGENT":
        responseData.push(
          { label: "Balance", value: user.balance || 0 },
          { label: "Admin", value: parentUser?.username || "N/A" },
          { label: "Min Bet", value: limits?.min_bet || 0 },
          { label: "Max Bet", value: limits?.max_bet || 0 },
          { label: "Maximum Share", value: limits?.max_share || 0 },
          { label: "Casino Commission", value: limits?.max_casino_commission || 0 },
          { label: "Lottery Commission", value: limits?.max_lottery_commission || 0 },
          { label: "Session Commission", value: limits?.max_session_commission || 0 }
        );
        break;

      case "ADMIN":
        responseData.push(
          { label: "Balance", value: user.balance || 0 },
          { label: "Super Admin", value: parentUser?.username || "N/A" }
        );
        break;

      case "SUPERADMIN":
        responseData.push(
          { label: "Balance", value: user.balance || 0 }
        );
        break;

      default:
        const errorResponse = createResponse("error", "CGP0015", "Invalid user role");
        logToFolderError("Dashboard/controller", "getDashboard", errorResponse);
        return res.status(400).json(errorResponse);
    }

    const successResponse = createResponse(
      "success",
      "CGP0016",
      "Dashboard fetched successfully",
      { dashboard: responseData }
    );

    logToFolderInfo("Dashboard/controller", "getDashboard", successResponse);
    return res.status(200).json(successResponse);

  } catch (error) {
    logger.error("Error fetching dashboard:", error);
    const errorResponse = createResponse(
      "error", 
      "CGP0017",
      "Internal server error",
      { error: error.message }
    );
    logToFolderError("Dashboard/controller", "getDashboard", errorResponse);
    return res.status(500).json(errorResponse);
  }
};