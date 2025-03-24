import { db } from "../config/db.js";
import { logger } from "../logger/logger.js";
import { users, ledger } from "../database/schema.js";
import { eq, and } from "drizzle-orm";
import { format } from "date-fns";

export const createInOutEntry = async (req, res) => {
  try {
    const {
      targetId,
      date,
      description,
      aya,
      gya,
      commPosative,
      commNegative,
      limit,
    } = req.body;

    const userId = req.session.userId;

    if (!targetId || !date || !description) {
      return res.status(400).json({
        uniqueCode: "CGP0085",
        message: "Target ID, date, and description are required",
        data: {},
      });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({
        uniqueCode: "CGP0086",
        message: "User not found",
        data: {},
      });
    }

    let parsedDate;
    try {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date");
      }
    } catch (error) {
      return res.status(400).json({
        uniqueCode: "CGP0087",
        message: "Invalid date format. Use YYYY-MM-DD",
        data: {},
      });
    }

    const numericFields = { aya, gya, commPosative, commNegative, limit };
    for (const [field, value] of Object.entries(numericFields)) {
      if (value !== undefined && (isNaN(value) || value < 0)) {
        return res.status(400).json({
          uniqueCode: "CGP0088",
          message: `Invalid ${field} value. Must be a non-negative number`,
          data: {},
        });
      }
    }

    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, targetId));
    if (!targetUser) {
      return res.status(404).json({
        uniqueCode: "CGP0090",
        message: "Target user not found",
        data: {},
      });
    }

    let parentChain = [];
    let currentUser = targetUser;
    while (currentUser.parent_id) {
      const [parent] = await db
        .select()
        .from(users)
        .where(eq(users.id, currentUser.parent_id));
      if (!parent) break;
      parentChain.push(parent);
      currentUser = parent;
    }

    for (const parent of parentChain) {
      await db.insert(ledger).values({
        user_id: parent.id,
        transaction_type: "INOUT",
        entry: "INOUT_ENTRY",
        debit: gya || 0,
        credit: aya || 0,
        stake_amount: (aya || 0) - (gya || 0),
        new_coins_balance: 0,
        new_exposure_balance: 0,
        new_wallet_balance: parent.balance + (aya || 0) - (gya || 0),
        description,
        created_at: new Date(),
      });
    }

    return res.status(200).json({
      uniqueCode: "CGP0093",
      message: "In-Out entry updated successfully",
      data: {
        date: format(parsedDate, "yyyy-MM-dd"),
        description,
        aya: aya || 0,
        gya: gya || 0,
        commPositive: commPosative || 0,
        commNegative: commNegative || 0,
        limit: limit || 0,
      },
    });
  } catch (error) {
    logger.error("Error updating in-out entry:", error);
    return res.status(500).json({
      uniqueCode: "CGP0094",
      message: "Internal server error",
      data: {},
    });
  }
};
