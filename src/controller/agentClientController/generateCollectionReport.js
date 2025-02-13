import { db } from "../../config/db.js";
import { ledger, users } from "../../database/schema.js";
import { eq, gt, inArray, and } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

// Query to get pending payments (BET_PLACED status)
const getPendingPayments = async () => {
  try {
    return await db
      .select({
        userId: ledger.userId,
        balance: ledger.balance,
      })
      .from(ledger)
      .where(and(eq(ledger.status, "BET_PLACED"), gt(ledger.balance, 0)));
  } catch (error) {
    let response = {
      uniqueCode: "CGP0068",
      message: "Error fetching pending payments",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "getCollectionReport", response);
    return [];
  }
};

// Query to get cleared payments (WIN or LOSS status)
const getClearedPayments = async () => {
  try {
    return await db
      .select({
        userId: ledger.userId,
        balance: ledger.balance,
      })
      .from(ledger)
      .where(inArray(ledger.status, ["WIN", "LOSS"]));
  } catch (error) {
    let response = {
      uniqueCode: "CGP0069",
      message: "Error fetching cleared payments",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "getCollectionReport", response);
    return [];
  }
};

// Query to get received payments (BET_PLACED status)
const getReceivedPayments = async () => {
  try {
    return await db
      .select({
        userId: ledger.userId,
        balance: ledger.balance,
      })
      .from(ledger)
      .where(and(eq(ledger.status, "BET_PLACED"), gt(ledger.balance, 0)));
  } catch (error) {
    let response = {
      uniqueCode: "CGP0070",
      message: "Error fetching received payments",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "getCollectionReport", response);
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
    let response = {
      uniqueCode: "CGP0071",
      message: "Error fetching client details",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "getCollectionReport", response);
    return {};
  }
};

// Generate Collection Report
const generateCollectionReport = async () => {
  try {
    const [pendingPayments, clearedPayments, receivedPayments] =
      await Promise.all([
        getPendingPayments(),
        getClearedPayments(),
        getReceivedPayments(),
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
    let response = {
      uniqueCode: "CGP0072",
      message: "Error generating collection report",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "getCollectionReport", response);
    return null;
  }
};

// API Handler for Collection Report
export const getCollectionReport = async (req, res) => {
  try {
    const report = await generateCollectionReport();

    if (!report) {
      let response = {
        uniqueCode: "CGP0073",
        message: "Error generating collection report",
        data: {},
      };
      logToFolderError("Agent/controller", "getCollectionReport", response);
      return res.status(500).json(response);
    }

    if (
      report.paymentReceivingFrom.length === 0 &&
      report.paymentPaidTo.length === 0 &&
      report.paymentCleared.length === 0
    ) {
      let response = {
        uniqueCode: "CGP0074",
        message: "No transactions found",
        data: {},
      };
      logToFolderInfo("Agent/controller", "getCollectionReport", response);
      return res.status(200).json(response);
    }

    let response = {
      uniqueCode: "CGP0075",
      message: "Collection report retrieved successfully",
      data: report,
    };
    logToFolderInfo("Agent/controller", "getCollectionReport", response);
    return res.status(200).json(response);
  } catch (error) {
    let response = {
      uniqueCode: "CGP0076",
      message: "Internal server error",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "getCollectionReport", response);
    return res.status(500).json(response);
  }
};
