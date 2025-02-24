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
    // Generate a unique user ID
    const newUserId = generateUserId();

    let successResponse = {
      uniqueCode: "CGP0107",
      message: "User ID successfully generated",
      data: { userId: newUserId },
    };

    logToFolderInfo("General/controller", "generateUserIdAPI", successResponse);

    return res.status(200).json(successResponse);
  } catch (error) {
    console.error(error);
    let errorResponse = {
      uniqueCode: "CGP0108",
      message: "Internal server error",
      data: { error: error.message },
    };

    logToFolderError("General/controller", "generateUserIdAPI", errorResponse);
    return res.status(500).json(errorResponse);
  }
};
