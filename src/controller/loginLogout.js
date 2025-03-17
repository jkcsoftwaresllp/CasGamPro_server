import { db } from "../config/db.js";
import { users } from "../database/schema.js";
import { eq } from "drizzle-orm";
import { BLOCKING_LEVELS } from "../database/modals/doNotChangeOrder.helper.js";
import { logger } from "../logger/logger.js";
import { createResponse } from "../helper/responseHelper.js";

export const loginUser = async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    logger.info("Login attempted with incomplete information");
    return res
      .status(400)
      .json(
        createResponse(
          "error",
          "CGP0041",
          "Please provide required information",
          {}
        )
      );
  }

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then((result) => result[0]); // Fetch single user

    if (!user) {
      return res
        .status(401)
        .json(createResponse("error", "CGP0042", "Invalid credentials", {}));
    }

    // Simulating password check (Replace with bcrypt comparison)
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
      return res
        .status(401)
        .json(createResponse("error", "CGP0043", "Invalid credentials", {}));
    }

    const blockingLevel = user.blocking_levels;
    const clientName = `${user.first_name} ${user.last_name || ""}`.trim();

    if (blockingLevel === BLOCKING_LEVELS[1]) {
      return res
        .status(403)
        .json(
          createResponse(
            "error",
            "CGP0044",
            "Your account is blocked and cannot access the platform",
            {}
          )
        );
    }

    // Set up session data
    req.session.authToken = true;
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.userRole = user.role;
    req.session.clientName = clientName;
    req.session.blockingLevel = blockingLevel;
    req.session.status = "success";

    req.session.save((err) => {
      if (err) {
        logger.error("Session save error:", err);
        return res
          .status(500)
          .json(
            createResponse("error", "CGP0045", "Error creating session", {})
          );
      }

      return res.status(200).json(
        createResponse("success", "CGP0046", "Login successful", {
          status: "success",
          userId: user.id,
          username: user.username,
          profilePic: null,
          userRole: user.role,
          clientName,
          blockingLevel,
        })
      );
    });
  } catch (error) {
    logger.error("Login Failed:", error);
    res
      .status(500)
      .json(createResponse("error", "CGP0047", "Internal Server Error", {}));
  }
};

export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error("Logout error:", err);
      return res
        .status(500)
        .json(createResponse("error", "CGP0048", "Error logging out", {}));
    }
    res.clearCookie(process.env.SESSION_COOKIE_NAME || "Session Cookie");
    res
      .status(200)
      .json(
        createResponse("success", "CGP0049", "Logged out successfully", {})
      );
  });
};
