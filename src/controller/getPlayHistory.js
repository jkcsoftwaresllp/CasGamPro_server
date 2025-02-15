import { logger } from "../logger/logger.js";

// Get client ledger entries
export const getPlayHistory = async (req, res) => {
  try {
    // TODO : Upate this API to give Actual data

    return res.status(200).json({
      uniqueCode: "CGP0085",
      message: "Play History fetched successfully. (D)",
      data: [],
    });
  } catch (error) {
    logger.error("Error fetching Play History:", error);
    return res.status(500).json({
      uniqueCode: "CGP0086",
      message: "Internal server error",
      data: {},
    });
  }
};
