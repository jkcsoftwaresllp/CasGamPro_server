import { pool } from "../config/db.js";
import { BLOCKING_LEVELS } from "../database/schema.js";
import { logger } from "../logger/logger.js";

export const loginUser = async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    logger.info("Login attempted with incomplete information");
    return res.status(400).json({
      uniqueCode: "CGP00U01",
      message: "Please provide required information",
      data: { status: "failed" },
    });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      userId,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({
        uniqueCode: "CGP00U02",
        message: "Invalid credentials",
        data: {},
      });
    }

    const user = rows[0];
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
      return res.status(401).json({
        uniqueCode: "CGP00U03",
        message: "Invalid credentials",
        data: {},
      });
    }
    // Check user's blocking level
    const blockingLevel = user.blocking_levels;
    const clientName = `${user.firstName} ${user.lastName}`;

    if (blockingLevel === BLOCKING_LEVELS[1]) {
      return res.status(403).json({
        uniqueCode: "CGP00U09",
        message: "Your account is blocked and cannot access the platform",
        data: {},
      });
    }

    // Set up session data
    req.session.authToken = true;
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.userRole = user.role;
    req.session.clientName = clientName;
    req.session.blockingLevel = blockingLevel;
    req.session.status = "success";

    // Save the session
    req.session.save((err) => {
      if (err) {
        logger.error("Session save error:", err);
        return res.status(500).json({
          uniqueCode: "CGP00U04",
          message: "Error creating session",
          data: {},
        });
      }

      return res.status(200).json({
        uniqueCode: "CGP00U05",
        message: "Login successful",
        data: {
          status: "success",
          userId: user.id,
          username: user.username,
          profilePic: null,
          userRole: user.role,
          clientName,
          blockingLevel,
        },
      });
    });
  } catch (error) {
    logger.error("Login Failed:", error);
    res.status(500).json({
      uniqueCode: "CGP00U06",
      message: "Internal Server Error",
      data: {},
    });
  }
};

export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error("Logout error:", err);
      return res.status(500).json({
        uniqueCode: "CGP00U07",
        message: "Error logging out",
        data: {},
      });
    }
    res.clearCookie(process.env.SESSION_COOKIE_NAME || "Session Cookie");
    res.status(200).json({
      uniqueCode: "CGP00U08",
      message: "Logged out successfully",
      data: {},
    });
  });
};
