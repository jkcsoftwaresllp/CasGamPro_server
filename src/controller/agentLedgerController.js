import { db } from "../config/db.js";
import { ledger, users } from "../database/schema.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { formatDateForMySQL } from "../utils/dateUtils.js"; // Utility function to format dates

export const getAgentTransactions = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      clientName,
      limit = 30,
      offset = 0,
    } = req.query;

    const recordsLimit = Math.min(parseInt(limit) || 30, 100);
    const recordsOffset = parseInt(offset) || 0;

    let conditions = [];
    if (userId) conditions.push(eq(ledger.userId, userId));
    if (clientName) conditions.push(eq(users.username, clientName));

    if (startDate) {
      conditions.push(
        gte(
          ledger.date,
          sql`CAST(${formatDateForMySQL(startDate)} AS DATETIME)`
        )
      );
    }
    if (endDate) {
      conditions.push(
        lte(
          ledger.date,
          sql`CAST(${formatDateForMySQL(endDate).replace(
            "00:00:00",
            "23:59:59"
          )} AS DATETIME)`
        )
      );
    }

    const results = await db
      .select()
      .from(ledger)
      .innerJoin(users, eq(ledger.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(ledger.date)
      .limit(recordsLimit)
      .offset(recordsOffset);

    const totalRecords = await db
      .select({ count: sql`COUNT(*)` })
      .from(ledger)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const nextOffset =
      recordsOffset + recordsLimit < totalRecords[0].count
        ? recordsOffset + recordsLimit
        : null;

    return res.json({
      success: true,
      data: results,
      totalRecords: totalRecords[0].count,
      nextOffset,
    });
  } catch (error) {
    console.error("Error fetching agent transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const createTransactionEntry = async (req, res) => {
  const {
    agentId,
    entry,
    betsAmount,
    profitAmount,
    lossAmount,
    agentProfitShare,
    agentCommission,
    balance,
    note,
  } = req.body;

  try {
    const newEntry = {
      agentId,
      entry,
      betsAmount,
      profitAmount,
      lossAmount,
      agentProfitShare,
      agentCommission,
      balance,
      note,
      date: new Date(),
    };

    const result = await db.insert(ledger).values(newEntry);

    return res.status(201).json({
      uniqueCode: 'CGP0083',
      success: true,
      message: "Transaction entry created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error creating transaction entry:", error);
    return res.status(500).json({
      uniqueCode: 'CGP0084',
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};