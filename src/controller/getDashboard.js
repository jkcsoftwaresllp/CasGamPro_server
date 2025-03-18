import { db } from "../config/db.js";
import { eq } from "drizzle-orm";
import { users, user_limits_commissions } from "../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../utils/logToFolder.js";
import { createResponse } from "../helper/responseHelper.js";

// Common response data for Agent, SuperAgent, and Admin
const getCommonRoleResponseData = (parentUser, limits) => [
  { label: "Parent", value: parentUser?.username || "N/A" },
  { label: "Maximum Share", value: limits?.max_share || 0 },
  { label: "Casino Commission", value: limits?.max_casino_commission || 0 },
  { label: "Lottery Commission", value: limits?.max_lottery_commission || 0 },
  { label: "Session Commission", value: limits?.max_session_commission || 0 },
];

const getCommonResponseData = (user, parentUser, limits) => {
  return [
    { label: "My User Name", value: user.username },
    { label: "My Name", value: `${user.first_name} ${user.last_name || ""}`.trim() },
    { label: "Access Level", value: user.role },
    { label: "Balance", value: user.balance || 0 },
    { label: "Min Bet", value: limits?.min_bet || 0 },
    { label: "Max Bet", value: limits?.max_bet || 0 },
  ];
};

const getRoleSpecificResponseData = (role, user, parentUser, limits) => {
  switch (role) {
    case "PLAYER":
      return [
        { label: "Agent", value: parentUser?.username || "N/A" },
        { label: "Min Bet", value: limits?.min_bet || 0 },
        { label: "Max Bet", value: limits?.max_bet || 0 },
      ];
    case "AGENT":
    case "SUPERAGENT":
    case "ADMIN":
      return getCommonRoleResponseData(parentUser, limits);
    case "SUPERADMIN":
      return [];
    default:
      return null;
  }
};

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

    // Common data for all roles
    let responseData = getCommonResponseData(user, parentUser, limits);

    // Role-specific data
    const roleSpecificData = getRoleSpecificResponseData(user.role, user, parentUser, limits);

    if (roleSpecificData === null) {
      const errorResponse = createResponse("error", "CGP0015", "Invalid user role");
      logToFolderError("Dashboard/controller", "getDashboard", errorResponse);
      return res.status(400).json(errorResponse);
    }

    // Merge the common data and role-specific data
    responseData = [...responseData, ...roleSpecificData];

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
