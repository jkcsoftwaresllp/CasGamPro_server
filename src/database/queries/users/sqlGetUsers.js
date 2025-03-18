import { users } from "../../modals/user.js";
import { user_limits_commissions } from "../../modals/userLimitCommission.js";
import { getOneByColumn, getManyWithFilters } from "../../../utils/dbUtils.js";
import { eq } from "drizzle-orm";

/**
 * Fetch user details by ID
 * @param {string} userId
 * @returns {Promise<Object | undefined>}
 */
export const getUserById = (userId) => {
  return getOneByColumn(users, "id", userId);
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
export const getClientsByParent = async (parentId, role, limit, offset, filters) => {
  const columns = {
    id: users.id,
    userName: users.username,
    firstName: users.first_name,
    lastName: users.last_name,
    role: users.role,
    lotteryCommission: user_limits_commissions.max_lottery_commission,
    casinoCommission: user_limits_commissions.max_casino_commission,
    matchShare: user_limits_commissions.max_share,
  };

  let results = [];

  if (role === "AGENT") {
    // Fetch only clients/players under the agent
    results = await getManyWithFilters(
      users.leftJoin(
        user_limits_commissions,
        eq(users.id, user_limits_commissions.user_id)
      ),
      columns,
      { parent_id: parentId, role: "CLIENT" }, // Get only clients under the agent
      limit,
      offset
    );
  } else if (role === "SUPERAGENT") {
    // Fetch agents under the SuperAgent
    const agents = await getManyWithFilters(
      users,
      { id: users.id, userName: users.username, role: users.role },
      { parent_id: parentId, role: "AGENT" } // Get agents under the SuperAgent
    );

    results = [...agents];

    // Fetch clients/players under each agent
    for (const agent of agents) {
      const clients = await getManyWithFilters(
        users.leftJoin(
          user_limits_commissions,
          eq(users.id, user_limits_commissions.user_id)
        ),
        columns,
        { parent_id: agent.id, role: "CLIENT" }, // Get clients under the agent
        limit,
        offset
      );
      results = [...results, ...clients];
    }
  } else if (role === "ADMIN") {
    // Fetch super agents under the admin
    const superAgents = await getManyWithFilters(
      users,
      { id: users.id, userName: users.username, role: users.role },
      { parent_id: parentId, role: "SUPERAGENT" }
    );

    results = [...superAgents];

    for (const superAgent of superAgents) {
      // Fetch agents under each superAgent
      const agents = await getManyWithFilters(
        users,
        { id: users.id, userName: users.username, role: users.role },
        { parent_id: superAgent.id, role: "AGENT" }
      );

      results = [...results, ...agents];

      for (const agent of agents) {
        // Fetch clients under each agent
        const clients = await getManyWithFilters(
          users.leftJoin(
            user_limits_commissions,
            eq(users.id, user_limits_commissions.user_id)
          ),
          columns,
          { parent_id: agent.id, role: "CLIENT" },
          limit,
          offset
        );
        results = [...results, ...clients];
      }
    }
  }

  return results;
};

