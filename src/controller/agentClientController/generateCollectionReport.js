import { db } from "../../config/db.js";
import { agents, players, ledger, users } from "../../database/schema.js";
import { eq, and, gt, inArray } from "drizzle-orm";
import { filterUtils } from "../../utils/filterUtils.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

// Query to get pending payments (BET_PLACED status)
const getPendingPayments = async (filters) => {
  try {
    const conditions = [
      eq(ledger.status, "BET_PLACED"),
      gt(ledger.balance, 0),
      ...filters,
    ];

    return await db
      .select({
        userId: ledger.userId,
        balance: ledger.balance,
      })
      .from(ledger)
      .where(and(...conditions));
  } catch (error) {
    logToFolderError("Agent/controller", "getPendingPayments", {
      error: error.message,
    });
    return [];
  }
};

// Query to get cleared payments (WIN or LOSS status)
const getClearedPayments = async (filters) => {
  try {
    const conditions = [inArray(ledger.status, ["WIN", "LOSS"]), ...filters];

    return await db
      .select({
        userId: ledger.userId,
        balance: ledger.balance,
      })
      .from(ledger)
      .where(and(...conditions));
  } catch (error) {
    logToFolderError("Agent/controller", "getClearedPayments", {
      error: error.message,
    });
    return [];
  }
};

// Query to get received payments (BET_PLACED status)
const getReceivedPayments = async (filters) => {
  try {
    const conditions = [
      eq(ledger.status, "BET_PLACED"),
      gt(ledger.balance, 0),
      ...filters,
    ];

    return await db
      .select({
        userId: ledger.userId,
        balance: ledger.balance,
      })
      .from(ledger)
      .where(and(...conditions));
  } catch (error) {
    logToFolderError("Agent/controller", "getReceivedPayments", {
      error: error.message,
    });
    return [];
  }
};

// Get client details from users table using userId
const getClientDetails = async (userIds) => {
  try {
    if (userIds.length === 0) return {};

    const clients = await db
      .select({
        userId: users.id,
        clientName: users.firstName,
      })
      .from(users)
      .where(inArray(users.id, userIds));

    return clients.reduce((map, client) => {
      map[client.userId] = client.clientName;
      return map;
    }, {});
  } catch (error) {
    logToFolderError("Agent/controller", "getClientDetails", {
      error: error.message,
    });
    return {};
  }
};

// Generate Collection Report with Filtering
const generateCollectionReport = async (queryParams) => {
  try {
    const filters = filterUtils(queryParams);

    const [pendingPayments, clearedPayments, receivedPayments] =
      await Promise.all([
        getPendingPayments(filters),
        getClearedPayments(filters),
        getReceivedPayments(filters),
      ]);

    const userIds = new Set([
      ...pendingPayments.map((r) => r.userId),
      ...clearedPayments.map((r) => r.userId),
      ...receivedPayments.map((r) => r.userId),
    ]);

    const clientMap = await getClientDetails([...userIds]);

    return {
      paymentReceivingFrom: pendingPayments.map((record) => ({
        clientId: record.userId,
        clientName: clientMap[record.userId] || "Unknown",
        balance: Number(record.balance) || 0,
      })),
      paymentPaidTo: receivedPayments.map((record) => ({
        clientId: record.userId,
        clientName: clientMap[record.userId] || "Unknown",
        balance: Number(record.balance) || 0,
      })),
      paymentCleared: clearedPayments.map((record) => ({
        clientId: record.userId,
        clientName: clientMap[record.userId] || "Unknown",
        balance: Number(record.balance) || 0,
      })),
    };
  } catch (error) {
    logToFolderError("Agent/controller", "generateCollectionReport", {
      error: error.message,
    });
    return null;
  }
};

// API Handler for Collection Report
export const getCollectionReport = async (req, res) => {
  try {
    const report = await generateCollectionReport(req.query);

    if (!report) {
      return res.status(500).json({
        uniqueCode: "CGP0073",
        message: "Error generating collection report",
      });
    }

    if (
      report.paymentReceivingFrom.length === 0 &&
      report.paymentPaidTo.length === 0 &&
      report.paymentCleared.length === 0
    ) {
      return res
        .status(200)
        .json({ uniqueCode: "CGP0074", message: "No transactions found" });
    }

    return res.status(200).json({
      uniqueCode: "CGP0075",
      message: "Collection report retrieved successfully",
      data: report,
    });
  } catch (error) {
    logToFolderError("Agent/controller", "getCollectionReport", {
      error: error.message,
    });
    return res
      .status(500)
      .json({ uniqueCode: "CGP0076", message: "Internal server error" });
  }
};
