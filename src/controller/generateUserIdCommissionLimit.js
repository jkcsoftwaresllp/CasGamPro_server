import { pool } from "../config/db.js";
import { logToFolderError, logToFolderInfo } from "../utils/logToFolder.js";

// Function to generate a unique user ID based on first name and timestamp
const generateUserId = (prefix = "C") => {
  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, ""); // Format HHMMSS
  return `${prefix.substring(0, 1).toUpperCase()}${timeStr}`;
};

// API to generate userId and validate commission limits
export const generateUserIdCommissionLimit = async (req, res) => {
  try {
    const agentId = req.session.userId; // Assuming agent ID is stored in session

    const [playerResult] = await pool.query(
      `SELECT  maxLotteryCommission, maxSessionCommission, maxShare ,maxCasinoCommission
       FROM agents WHERE userId = ?`,
      [agentId]
    );

    if (playerResult.length === 0) {
      let errorResponse = {
        uniqueCode: "CGP0106",
        message: "Agent not found or unauthorized",
        data: {},
      };

      logToFolderError(
        "General/controller",
        "generateUserIdCommissionLimit",
        errorResponse
      );

      return res.status(403).json(errorResponse);
    }

    const {
      maxCasinoCommission,
      maxLotteryCommission,
      maxSessionCommission,
      maxShare,
    } = playerResult[0];

    // Generate a unique user ID
    const newUserId = generateUserId();

    let successResponse = {
      uniqueCode: "CGP0107",
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
    console.log(error);
    let errorResponse = {
      uniqueCode: "CGP0108",
      message: "Internal server error",
      data: { error: error.message },
    };

    logToFolderError(
      "General/controller",
      "generateUserIdCommissionLimit",
      errorResponse
    );
    return res.status(500).json(errorResponse);
  }
};
