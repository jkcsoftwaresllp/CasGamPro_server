import { logger } from "../logger/logger.js";
import { getUserById } from "../controller/userController/getUserById.js";

export const checkBlockingLevel = async (req, res, next) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({
      uniqueCode: "CGP0025",
      message: "Unauthorized: No active session found.",
      data: {},
    });
  }

  try {
    // Fetch user details
    const user = await getUserById(userId); // Now it returns user data

    if (!user) {
      return res.status(404).json({
        uniqueCode: "CGP0026",
        message: "User not found.",
        data: {},
      });
    }

    switch (user.blockingLevels) {
      case "LEVEL_1":
        return res.status(403).json({
          uniqueCode: "CGP0027",
          message:
            "Access Denied: You are completely blocked from the platform.",
          data: {},
        });

      case "LEVEL_2":
        if (req.method !== "GET") {
          return res.status(403).json({
            uniqueCode: "CGP0028",
            message: "Access Denied: You are restricted to viewing only.",
            data: {},
          });
        }
        break;

      case "LEVEL_3":
        if (req.path.startsWith("/games") && req.method === "POST") {
          return res.status(403).json({
            uniqueCode: "CGP0029",
            message: "Access Denied: You cannot play games.",
            data: {},
          });
        }
        break;

      case "NONE":
        break;

      default:
        return res.status(500).json({
          uniqueCode: "CGP0030",
          message: "Unknown blocking level. Please contact support.",
          data: {},
        });
    }

    next();
  } catch (error) {
    logger.error("Error fetching user:", error);
    res.status(500).json({
      uniqueCode: "CGP0031",
      message: "Internal server error. Please try again later.",
      data: {},
    });
  }
};
