import { logger } from "../logger/logger.js";


export const inOutReport = async (req, res) => {
  try {
    return res.status(200).json({
      uniqueCode: "CGP0088",
      message: "In-Out entry fetch successfully",
      data: [],
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
