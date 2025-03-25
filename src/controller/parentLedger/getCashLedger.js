import { db } from "../../config/db.js";
import { ledger, users } from "../../database/schema.js";
import { eq, sum, desc, sql, asc } from "drizzle-orm";
import { formatDate } from "../../utils/formatDate.js";

export const getCashLedger = async (req, res) => {
  try {
    const requesterId = req.session.userId;
    const userId = req.params.userId;
    const { startDate, endDate, limit = 30, offset = 0 } = req.query;
    if (!userId) {
      return res.status(400).json({
        uniqueCode: "CGP0166",
        message: "User ID is required",
        data: {},
      });
    }

    // Validate hierarchy: Ensure requester has access to userId
    const userHierarchy = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then((res) => res[0]);

    if (!userHierarchy) {
      return res.status(404).json({
        uniqueCode: "CGP0171",
        message: "User not found",
        data: {},
      });
    }

    let currentUser = userHierarchy;
    let hasAccess = false;

    while (currentUser.parent_id) {
      if (currentUser.parent_id === requesterId) {
        hasAccess = true;
        break;
      }
      currentUser = await db
        .select()
        .from(users)
        .where(eq(users.id, currentUser.parent_id))
        .then((res) => res[0]);
      if (!currentUser) break;
    }

    if (!hasAccess) {
      return res.status(403).json({
        uniqueCode: "CGP0168",
        message: "You do not have permission to access this user's ledger",
        data: {},
      });
    }
    
    //TODO: Add database

    return res.status(200).json({
      uniqueCode: "CGP0169",
      message: "Cash ledger fetched successfully",
      data: {  },
    });
  } catch (error) {
    console.error("Error fetching cash ledger:", error);
    return res.status(500).json({
      uniqueCode: "CGP0170",
      message: "Internal server error",
      data: {},
    });
  }
};
