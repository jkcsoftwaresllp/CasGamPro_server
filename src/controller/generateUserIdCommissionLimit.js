import { pool } from "../config/db.js";
import { logToFolderError, logToFolderInfo } from "../utils/logToFolder.js";

// Function to generate a unique user ID based on first name and timestamp
const generateUserId = (firstName) => {
  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, ""); // Format HHMMSS
  return `${firstName.substring(0, 3).toUpperCase()}${timeStr}`;
};

// API to generate userId and validate commission limits
export const generateUserIdCommissionLimit = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      firstName,
      share,
      sessionCommission,
      lotteryCommission,
      casinoCommission,
    } = req.body;
    const agentId = req.session.userId; // Assuming agent ID is stored in session

    // Validate required fields
    if (
      !firstName ||
      share === undefined ||
      sessionCommission === undefined ||
      lotteryCommission === undefined ||
      casinoCommission === undefined
    ) {
      let errorResponse = {
        uniqueCode: "USR01",
        message: "All fields are required",
        data: {},
      };
      logToFolderError(
        "General/controller",
        "generateUserIdCommissionLimit",
        errorResponse
      );
      return res.status(400).json(errorResponse);
    }

    const [playerResult] = await connection.query(
      `SELECT  maxLotteryCommission, maxSessionCommission, maxShare ,maxCasinoCommission
       FROM agents WHERE userId = ?`,
      [agentId]
    );

    if (playerResult.length === 0) {
      let errorResponse = {
        uniqueCode: "USR02",
        message: "Agent not found or unauthorized",
        data: {},
      };
      logToFolderError(
        "General/controller",
        "generateUserIdCommissionLimit",
        errorResponse
      );
      await connection.rollback();
      return res.status(403).json(errorResponse);
    }

    const {
      maxCasinoCommission,
      maxLotteryCommission,
      maxSessionCommission,
      maxShare,
    } = playerResult[0];

    // ✅ Validate commission and share limits
    if (share > maxShare) {
      return res.status(403).json({
        uniqueCode: "USR03",
        message: "Share exceeds the allowed limit",
        data: {},
      });
    }
    if (sessionCommission > maxSessionCommission) {
      return res.status(403).json({
        uniqueCode: "USR04",
        message: "Session Commission exceeds the allowed limit",
        data: {},
      });
    }
    if (lotteryCommission > maxLotteryCommission) {
      return res.status(403).json({
        uniqueCode: "USR05",
        message: "Lottery Commission exceeds the allowed limit",
        data: {},
      });
    }
    if (casinoCommission > maxCasinoCommission) {
      return res.status(403).json({
        uniqueCode: "USR06",
        message: "Casino Commission exceeds the allowed limit",
        data: {},
      });
    }

    // ✅ Generate a unique user ID
    const newUserId = generateUserId(firstName);

    // ✅ Commit the transaction
    await connection.commit();

    let successResponse = {
      uniqueCode: "USR07",
      message: "User ID generated and limits validated",
      data: {
        userId: newUserId,
        maxShare,
        maxCasinoCommission,
        maxLotteryCommission,
        maxSessionCommission,
      },
    };
    logToFolderInfo(
      "General/controller",
      "generateUserIdCommissionLimit",
      successResponse
    );

    return res.status(200).json(successResponse);
  } catch (error) {
    await connection.rollback(); // ✅ Rollback transaction on error
    let errorResponse = {
      uniqueCode: "USR08",
      message: "Internal server error",
      data: { error: error.message },
    };
    logToFolderError(
      "General/controller",
      "generateUserIdCommissionLimit",
      errorResponse
    );
    return res.status(500).json(errorResponse);
  } finally {
    connection.release(); // ✅ Release the connection back to the pool
  }
};
