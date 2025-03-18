import { users } from "../../modals/user.js";
import { user_limits_commissions } from "../../modals/userLimitCommission.js";
import { getOneByColumn, getManyWithFilters } from "../../../utils/dbUtils.js";
import { eq } from "drizzle-orm";
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
    userName: users.username,
    firstName: users.first_name,
    lastName: users.last_name,
    role: users.role,
    lotteryCommission: user_limits_commissions.max_lottery_commission,
    casinoCommission: user_limits_commissions.max_casino_commission,
    matchShare: user_limits_commissions.max_share,
  };

  const userTable = await db
    .select(columns)
    .from(users)
    .leftJoin(
      user_limits_commissions,
      eq(users.id, user_limits_commissions.user_id)
    )
    .where(eq(users.parent_id, parentId));

  return userTable;
};
