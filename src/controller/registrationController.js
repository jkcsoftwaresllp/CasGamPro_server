import { pool } from "../config/db.js";
import crypto from "crypto";
import { logger } from "../logger/logger.js";

// To generate a random 8-character password
const generatePassword = () => {
  return crypto.randomBytes(4).toString("hex");
};

// Generate userId with firstName and datetime
const generateUserId = (firstName) => {
  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, ""); // Get HHMMSS
  return `${firstName.substring(0, 3).toUpperCase()}${timeStr}`;
};

const isAlphabetic = (value) => /^[A-Za-z]+$/.test(value);

const isNumeric = (value) => !isNaN(value) && !isNaN(parseFloat(value));

export const registerUser = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      firstName,
      lastName,
      fixLimit,
      matchShare,
      sessionCommission,
      lotteryCommission,
      password,
    } = req.body;

    const agentId = req.session.userId; // Fetch logged-in agent ID
    if (!agentId) {
      return res.status(401).json({
        uniqueCode: "CGP00R03",
        message: "Unauthorized: Agent session missing.",
        data: {},
      });
    }

    // Validation checks

    const requiredFields = {
      firstName,
      lastName,
      fixLimit,
      matchShare,
      sessionCommission,
      lotteryCommission,
    };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res.status(400).json({
          uniqueCode: "CGP00R01",
          message: `${key} is required.`,
          data: {},
        });
      }
    }

    if (!isAlphabetic(firstName) || !isAlphabetic(lastName)) {
      return res.status(400).json({
        uniqueCode: "CGP00R02",
        message: "First and Last names must contain only alphabets.",
        data: {},
      });
    }
    // Fetch agent-specific limits

    // Validate share and commission limits
    if (!isNumeric(fixLimit) || fixLimit < 0 || fixLimit > 18) {
      return res.status(400).json({
        uniqueCode: "CGP00R04",
        message: "Fix Limit must be a numeric value between 0 and 18",
        data: {},
      });
    }

    if (!isNumeric(matchShare) || matchShare < 0 || matchShare > 3) {
      return res.status(400).json({
        uniqueCode: "CGP00R05",
        message: "Match Share must be a numeric value between 0 and 3",
        data: {},
      });
    }

    if (
      !isNumeric(sessionCommission) ||
      sessionCommission < 0 ||
      sessionCommission > 3
    ) {
      return res.status(400).json({
        uniqueCode: "CGP00R06",
        message: "Session Commission must be a numeric value between 0 and 3",
        data: {},
      });
    }
    // Password validation
    if (!/^[a-zA-Z0-9!@#$%^&*]{4,6}$/.test(password)) {
      return res.status(400).json({
        uniqueCode: "CGP00R08",
        message:
          "Password must be 4-6 characters long and can include special characters.",
        data: {},
      });
    }

    // // Generate password
    // const password = generatePassword();

    // Check for existing userId collisions
    const [existingUser] = await connection.query(
      "SELECT username FROM users WHERE username = ?",
      [username]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({
        uniqueCode: "CGP00R09",
        message: "Username already exists",
        data: {},
      });
    }
    const username = generateUserId(firstName); // username = userId
    // Insert into users table
    const insertUserQuery = `
      INSERT INTO users (username, firstName, lastName, password, blocked, role)
      VALUES (?, ?, ?, ?, false, 'PLAYER')
    `;

    const [userResult] = await connection.query(insertUserQuery, [
      username,
      firstName,
      lastName,
      password,
    ]);

    /* TODO: Change `balance` for player */

    // Insert into players table
    const insertPlayerQuery = `
      INSERT INTO players (userId, agentId, balance, fixLimit, matchShare, sessionCommission, lotteryCommission)
      VALUES (?, ?, 100, ?, ?, ?, ?)
    `;

    await connection.query(insertPlayerQuery, [
      userResult.insertId,
      agentId,
      fixLimit,
      matchShare,
      sessionCommission,
      lotteryCommission,
    ]);

    await connection.commit();

    return res.status(201).json({
      uniqueCode: "CGP00R07",
      message: "Player registered successfully",
      data: {
        username: username,
        password: password,
      },
    });
  } catch (error) {
    await connection.rollback();
    logger.error("Error registering player:", error);
    res.status(500).json({
      uniqueCode: "CGP00R08",
      message: "Internal server error",
      data: {},
    });
  } finally {
    connection.release();
  }
};
