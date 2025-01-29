import { pool } from "../../config/db.js";
import crypto from "crypto";
import { logger } from "../../logger/logger.js";

// Generate a random alphanumeric password (4-6 characters)
const generatePassword = () => {
  return crypto.randomBytes(4).toString("hex");
};

// Generate a unique client ID based on a prefix and random number

const generateClientId = (firstName) => {
  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, ""); // Get HHMMSS
  return `${firstName.substring(0, 3).toUpperCase()}${timeStr}`;
};

const isAlphabetic = (value) => /^[A-Za-z]+$/.test(value);

const isNumeric = (value) => !isNaN(value) && !isNaN(parseFloat(value));

// API to register a new client for an agent
export const registerClient = async (req, res) => {
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
    } = req.body;
    const agentId = req.session.userId;
    console.log("agentId", agentId);

    if (
      !firstName ||
      !lastName ||
      fixLimit === undefined ||
      matchShare === undefined ||
      sessionCommission === undefined ||
      lotteryCommission === undefined
    ) {
      return res.status(400).json({
        uniqueCode: "CGP01R01",
        message: "All fields are required",
        data: {},
      });
    }

    if (!isAlphabetic(firstName) || !isAlphabetic(lastName)) {
      return res.status(400).json({
        uniqueCode: "CGP01R02",
        message: "First name and Last name should only contain alphabets",
        data: {},
      });
    }
    // Validate agent's existence and permissions
    const agentQuery = `SELECT * FROM agents WHERE id = ?`;
    const [agentResult] = await connection.query(agentQuery, [agentId]);

    if (agentResult.length === 0) {
      return res.status(403).json({
        uniqueCode: "CGP01R03",
        message: "Agent not found or unauthorized",
        data: {},
      });
    }

    // Fetch the agent's commission details
    const commissionQuery = `SELECT maxCasinoCommission, maxLotteryCommission, maxSessionCommission, maximumShare FROM agents WHERE id = ?`;
    const [commissionResult] = await connection.query(commissionQuery, [
      agentId,
    ]);
    const {
      maxCasinoCommission,
      maxLotteryCommission,
      maxSessionCommission,
      maximumShare,
    } = commissionResult[0];

    // Validate Limits
    if (matchShare > maximumShare)
      return res.status(403).json({
        uniqueCode: "CGP01R10",
        message: "Match Share exceeds the agent's maximum",
        data: {},
      });

    if (sessionCommission > maxSessionCommission)
      return res.status(403).json({
        uniqueCode: "CGP01R11",
        message: "Session Commission exceeds the agent's maximum",
        data: {},
      });
    if (lotteryCommission > maxLotteryCommission)
      return res.status(403).json({
        uniqueCode: "CGP01R12",
        message: "Lottery Commission exceeds the agent's maximum",
        data: {},
      });

    // Generate unique client ID and temporary password
    const clientId = generateClientId(firstName);
    const temporaryPassword = generatePassword();

    // Check for Unique Username
    const [existingUser] = await connection.query(
      "SELECT username FROM users WHERE username = ?",
      [clientId]
    );
    if (existingUser.length)
      return res.status(409).json({
        uniqueCode: "CGP01R13",
        message: "Username already exists",
        data: {},
      });

    //Insert the new user (player) into the users table
    const insertUserQuery = `
 INSERT INTO users (username, firstName, lastName, password, blocked, roles, blocking_levels)
 VALUES (?, ?, ?, ?, false, 'PLAYER', 'NONE')
`;

    const [userResult] = await connection.query(insertUserQuery, [
      clientId,
      firstName,
      lastName,
      temporaryPassword,
    ]);

    //Get the generated user ID (from the users table) for the new player
    const userId = userResult.insertId;

    // Insert the new player into the players table
    const insertPlayerQuery = `
      INSERT INTO players (userId, agentId, balance, fixLimit, matchShare, lotteryCommission, sessionCommission)
      VALUES (?, ?, 0.0, ?, ?, ?, ?)
    `;
    await connection.query(insertPlayerQuery, [
      userId,
      agentId,
      fixLimit,
      matchShare,
      lotteryCommission,
      sessionCommission,
    ]);
    // Return the generated values
    await connection.commit();

    return res.status(200).json({
      uniqueCode: "CGP01R02",
      message: "Client registration data generated successfully",
      data: {
        clientId: clientId,
        maxShareLimit: maximumShare,
        maxCasinoCommission: maxCasinoCommission,
        maxLotteryCommission: maxLotteryCommission,
        temporaryPassword: temporaryPassword,
      },
    });
  } catch (error) {
    await connection.rollback();
    logger.error("Error registering client:", error);
    res.status(500).json({
      uniqueCode: "CGP01R03",
      message: "Internal server error",
      data: {},
    });
  } finally {
    connection.release();
  }
};
