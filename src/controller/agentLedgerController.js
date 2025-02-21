import { db } from "../config/db.js";
import { ledger, users, players, agents } from "../database/schema.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../utils/logToFolder.js";
import { filterUtils } from "../utils/filterUtils.js";

export const getAgentTransactions = async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;

    // Sanitize limit and offset
    const recordsLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const recordsOffset = Math.max(parseInt(offset) || 0, 0);

    // Get filtering conditions from utility
    const conditions = filterUtils(req.query);

    // Fetch transactions
    const results = await db
      .select({
        agentId: users.id,
        entry: ledger.entry,
        betsAmount: ledger.stakeAmount,
        profitAmount: ledger.amount,
        lossAmount: ledger.debit,
        credit: ledger.credit,
        debit: ledger.debit,
        agentCommission: agents.maxSessionCommission,
        balance: ledger.balance,
        note: ledger.result,
      })
      .from(ledger)
      .innerJoin(users, eq(ledger.userId, users.id))
      .innerJoin(players, eq(users.id, players.userId))
      .innerJoin(agents, eq(players.agentId, agents.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(ledger.date)
      .limit(recordsLimit)
      .offset(recordsOffset);

    // Fetch total record count
    const totalRecords = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(ledger)
      .innerJoin(users, eq(ledger.userId, users.id))
      .innerJoin(players, eq(users.id, players.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Calculate next offset
    const nextOffset =
      recordsOffset + recordsLimit < totalRecords[0].count
        ? recordsOffset + recordsLimit
        : null;

    let response = {
      uniqueCode: "CGP0081",
      success: true,
      message: "Agent transactions fetched successfully",
      data: { results, totalRecords: totalRecords[0].count, nextOffset },
    };

    logToFolderInfo(
      "Transactions/controller",
      "getAgentTransactions",
      response
    );
    return res.json(response);
  } catch (error) {
    let errorResponse = {
      uniqueCode: "CGP0082",
      success: false,
      message: "Internal Server Error",
      error: error.message,
    };

    logToFolderError(
      "Transactions/controller",
      "getAgentTransactions",
      errorResponse
    );
    return res.status(500).json(errorResponse);
  }
};

export const createTransactionEntry = async (req, res) => {
  const {
    agentId,
    entry,
    betsAmount,
    profitAmount,
    lossAmount,
    credit,
    debit,
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
      credit,
      debit,
      agentCommission,
      balance,
      note,
      date: new Date(),
    };

    const result = await db.insert(ledger).values(newEntry);

    let response = {
      uniqueCode: "CGP0083",
      success: true,
      message: "Transaction entry created successfully",
      data: { results: result },
    };

    logToFolderInfo(
      "Transactions/controller",
      "createTransactionEntry",
      response
    );
    return res.status(201).json(response);
  } catch (error) {
    let errorResponse = {
      uniqueCode: "CGP0084",
      success: false,
      message: "Internal Server Error",
      error: error.message,
    };

    logToFolderError(
      "Transactions/controller",
      "createTransactionEntry",
      errorResponse
    );
    console.error("Error creating transaction entry:", error);
    return res.status(500).json(errorResponse);
  }
};
