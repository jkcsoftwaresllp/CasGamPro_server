import { db } from "../../config/db.js";
import { ledger, users, game_rounds, wallet_transactions } from "../../database/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { getGameName } from "../../utils/getGameName.js";
import { convertToDelhiISO, formatDate } from "../../utils/formatDate.js";
import { filterUtils } from "../../utils/filterUtils.js";

const getPrefixBeforeUnderscore = (roundId) => {
  return roundId ? roundId.split("_")[0] : "";
};

export const getUserStatementForParent = async (req, res) => {
  try {
    const agentUserId = req.session.userId;
    const userId = req.params.userId;
    const { limit = 30, offset = 0, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0175",
        message: "User ID is required",
        data: {},
      });
    }

    // Verify if the logged-in user is an agent
    const agent = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .then((res) => res[0]);

    if (!agent) {
      return res.status(403).json({
        uniqueCode: "CGP0176",
        message: "Not authorized",
        data: {},
      });
    }

    // Verify the hierarchy
    const userToFetch = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .then((res) => res[0]);

    if (!userToFetch || userToFetch.parent_id !== agentUserId) {
      return res.status(403).json({
        uniqueCode: "CGP0179",
        message: "Unauthorized access to user data",
        data: {} });
    }

    // Apply filters
    const filters = filterUtils({ startDate, endDate, userId });

    //TODO: Attach Database

    return res.status(200).json({
      uniqueCode: "CGP0177",
      message: "User ledger entries fetched successfully",
      data: {},
    });
  } catch (error) {
    logger.error("Error fetching user ledger entries:", error);
    return res.status(500).json({
      uniqueCode: "CGP0178",
      message: "Internal server error",
      data: {},
    });
  }
};
