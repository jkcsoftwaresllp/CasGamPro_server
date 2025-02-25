import { logger } from "../logger/logger.js";

export const inOutReport = async (req, res) => {
  try {
    // TODO : Complete this Dummy API
    return res.status(200).json({
      uniqueCode: "CGP0088",
      message: "In-Out entry fetch successfully",
      data: { results: [] },
    });
  } catch (error) {
    logger.error("Error In-Out entry fetch:", error);
    return res.status(500).json({
      uniqueCode: "CGP0089",
      message: "Internal server error",
      data: {},
    });
  }
};
