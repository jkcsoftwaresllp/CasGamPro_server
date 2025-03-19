import { users } from "../../modals/user.js";
import { user_limits_commissions } from "../../modals/userLimitCommission.js";
import { getOneByColumn, getManyWithFilters } from "../../../utils/dbUtils.js";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../config/db.js";

/**
 * Fetch user details by ID
 * @param {string} userId
 * @returns {Promise<Object | undefined>}
 */
export const getUserById = (userId) => {
  return getOneByColumn(users, "id", userId);
};

/**
 * Fetch user role by ID
 * @param {string} userId
 * @returns {Promise<string | undefined>} - User's role
 */
export const getUserRoleById = async (userId) => {
  const result = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId));

  return result.length > 0 ? result[0].role : undefined;
};

/**
 * Fetch clients based on parent ID (Agent or Super Agent)
 * Includes commission and betting limits
 * @param {string} parentId - ID of the parent user
 * @param {string} role - Role of the parent user (SUPERAGENT or AGENT)
 * @param {number} limit - Pagination limit
 * @param {number} offset - Pagination offset
 * @param {Object} filters - Additional filters for the query
 * @returns {Promise<Array>}
 */
export const getChildsByParent = async (parentId) => {
  const columns = {
    id: users.id,
    firstName: users.first_name,
    lastName: users.last_name,
    role: users.role, // Added role field
    lotteryCommission: user_limits_commissions.max_lottery_commission,
    casinoCommission: user_limits_commissions.max_casino_commission,
    matchShare: user_limits_commissions.max_share,
    currentLimit: users.balance,
  };

  const userTable = await db
    .select(columns)
    .from(users)
    .innerJoin(
      user_limits_commissions,
      eq(users.id, user_limits_commissions.user_id)
    )
    .where(eq(users.parent_id, parentId));

  return userTable;
};

/**
 * Fetch all affected users recursively (players or agents under a given user)
 * @param {string} userId - ID of the root user
 * @returns {Promise<string[]>} - List of affected user IDs
 */
export const getHierarchyUnderUser = async (userId, role) => {
  try {
    if (role === "SUPERAGENT") {
      // Step 1: Fetch all agents under the superagent
      const agents = await db
        .select({ agentId: users.id })
        .from(users)
        .where(eq(users.parent_id, userId)) // Agents under SuperAgent
        .where(eq(users.role, "AGENT"));

      const agentIds = agents.map((agent) => agent.agentId);

      // Step 2: Fetch players under these agents
      let playersUnderAgents = [];
      if (agentIds.length > 0) {
        playersUnderAgents = await db
          .select({ playerId: users.id })
          .from(users)
          .where(inArray(users.parent_id, agentIds)) // Players under agents
          .where(eq(users.role, "PLAYER"));
      }

      return {
        role,
        agents: agentIds,
        playersUnderAgents: playersUnderAgents.map((p) => p.playerId),
      };
    }

    if (role === "AGENT") {
      // Fetch only players directly under the agent
      const players = await db
        .select({ playerId: users.id })
        .from(users)
        .where(eq(users.parent_id, userId)) // Players under agent
        .where(eq(users.role, "PLAYER"));

      return {
        role,
        players: players.map((p) => p.playerId),
      };
    }

    if (role === "PLAYER") {
      // Players do not have any hierarchy
      return {
        role,
        message: "Players do not have child users",
      };
    }

    return { error: "Invalid role provided" };
  } catch (error) {
    console.error("Error fetching player hierarchy:", error);
    throw error;
  }
};
