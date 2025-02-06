import { pool } from "../../config/db.js";
import crypto from "crypto";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

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

    if (
      !firstName ||
      !lastName ||
      fixLimit === undefined ||
      matchShare === undefined ||
      sessionCommission === undefined ||
      lotteryCommission === undefined
    ) {
      let temp5 = {
        uniqueCode: "CGP01R01",
        message: "All fields are required",
        data: {},
      };
      logToFolderError("client/controller", "registerClient", temp5);
      return res.status(400).json(temp5);
    }

    if (!isAlphabetic(firstName) || !isAlphabetic(lastName)) {
      let temp6 = {
        uniqueCode: "CGP01R02",
        message: "First name and Last name should only contain alphabets",
        data: {},
      };
      logToFolderError("client/controller", "registerClient", temp6);
      return res.status(400).json(temp6);
    }
    // Validate agent's existence and permissions
    const [agentResult] = await connection.query(
      `SELECT * FROM agents WHERE userId = ?`,
      [agentId]
    );
    if (agentResult.length === 0) {
      let temp7 = {
        uniqueCode: "CGP01R03",
        message: "Agent not found or unauthorized",
        data: {},
      };
      logToFolderError("client/controller", "registerClient", temp7);
      return res.status(403).json(temp7);
    }

    // Fetch the agent's commission details
    const [commissionResult] = await connection.query(
      `SELECT maxCasinoCommission, maxLotteryCommission, maxSessionCommission, maxShare 
       FROM agents WHERE userId = ?`,
      [agentId]
    );
    console.log("commission result:", commissionResult);
    if (commissionResult.length === 0) {
      let errorResponse = {
        uniqueCode: "CGP01R04",
        message: "Unable to fetch agent's commission details",
        data: {},
      };
      logToFolderError("client/controller", "registerClient", errorResponse);
      return res.status(500).json(errorResponse);
    }
    const {
      maxCasinoCommission,
      maxLotteryCommission,
      maxSessionCommission,
      maxShare,
    } = commissionResult[0];

    // Validate Limits
    if (matchShare > maxShare) {
      let temp8 = {
        uniqueCode: "CGP01R10",
        message: "Match Share exceeds the agent's maximum",
        data: {},
      };
      logToFolderError("client/controller", "registerClient", temp8);
      return res.status(403).json(temp8);
    }

    if (sessionCommission > maxSessionCommission) {
      let temp9 = {
        uniqueCode: "CGP01R11",
        message: "Session Commission exceeds the agent's maximum",
        data: {},
      };
      logToFolderError("client/controller", "registerClient", temp9);
      return res.status(403).json(temp9);
    }
    if (lotteryCommission > maxLotteryCommission) {
      let temp10 = {
        uniqueCode: "CGP01R12",
        message: "Lottery Commission exceeds the agent's maximum",
        data: {},
      };
      logToFolderError("client/controller", "registerClient", temp10);

      return res.status(403).json(temp10);
    }

    // Generate unique client ID and temporary password
    const clientId = generateClientId(firstName);
    const temporaryPassword = generatePassword();

    // Check for Unique Username
    const [existingUser] = await connection.query(
      "SELECT username FROM users WHERE username = ?",
      [clientId]
    );
    if (existingUser.length) {
      let temp11 = {
        uniqueCode: "CGP01R13",
        message: "Username already exists",
        data: {},
      };
      logToFolderError("client/controller", "registerClient", temp11);
      return res.status(409).json(temp11);
    }

    //Insert the new user (player) into the users table
    const insertUserQuery = `
 INSERT INTO users (username, firstName, lastName, password, role, blocking_levels)
 VALUES (?, ?, ?, ?, 'PLAYER', 'NONE')
`;

    const [userResult] = await connection.query(insertUserQuery, [
      clientId,
      firstName,
      lastName,
      temporaryPassword,
    ]);

    const userId = userResult.insertId; //Get the generated user ID (from the users table) for the new player

    const correctAgentId = agentResult[0].id;

    // Insert the new player into the players table
    const insertPlayerQuery = `
      INSERT INTO players (userId, agentId, balance, fixLimit, matchShare, lotteryCommission, sessionCommission)
      VALUES (?, ?,0.00, ?, ?, ?, ?)
    `;
    await connection.query(insertPlayerQuery, [
      userId,
      correctAgentId,
      fixLimit,
      matchShare,
      lotteryCommission,
      sessionCommission,
    ]);
    // Return the generated values
    await connection.commit();
    let temp12 = {
      uniqueCode: "CGP01R02",
      message: "Client registration data generated successfully",
      data: {
        clientId,
        maxShareLimit: maxShare,
        maxCasinoCommission,
        maxLotteryCommission,
        temporaryPassword,
      },
    };
    logToFolderInfo("client/controller", "registerClient", temp12);

    return res.status(200).json(temp12);
  } catch (error) {
    await connection.rollback();
    let temp13 = {
      uniqueCode: "CGP01R03",
      message: "Internal server error",
      data: { error: error.message },
    };
    logToFolderInfo("client/controller", "registerClient", temp13);
    return res.status(500).json(temp13);
  } finally {
    connection.release();
  }
};
