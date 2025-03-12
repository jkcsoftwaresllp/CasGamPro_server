import { pool } from "../../config/db.js";
import socketManager from "../../services/shared/config/socket-manager.js";

// Utility Function
const isAlphabetic = (value) => /^[A-Za-z]+$/.test(value);

// Helper Function to Get User Info (Agent, SuperAgent, etc.)
const getUserInfo = async (connection, role, requesterId) => {
  const tableMap = {
    AGENT: 'agents',
    SUPERAGENT: 'superAgents',
  };
  
  const table = tableMap[role];
  
  if (!table) {
    throw new Error(`Unsupported role: ${role}`);
  }

  const query = `SELECT id, balance, maxCasinoCommission, maxLotteryCommission, maxShare FROM ${table} WHERE userId = ?`;
  const [result] = await connection.query(query, [requesterId]);

  return result.length ? result[0] : null;
};

// Helper Function to Deduct Balance from Role-Specific Table
const deductBalance = async (connection, balance, requesterId, role) => {
  const tableMap = {
    AGENT: 'agents',
    SUPERAGENT: 'superAgents',
  };

  const table = tableMap[role];
  
  if (!table) {
    throw new Error(`Unsupported role: ${role}`);
  }

  const updateQuery = `UPDATE ${table} SET balance = balance - ? WHERE userId = ?`;
  await connection.query(updateQuery, [balance, requesterId]);
};

// Helper Function to Insert User (Common for both Agent and Player)
const insertUser = async (connection, generatedUserId, firstName, lastName, password, role) => {
  const [userResult] = await connection.query(
    `INSERT INTO users (username, firstName, lastName, password, role, blocking_levels) 
    VALUES (?, ?, ?, ?, ?, 'NONE')`,
    [generatedUserId, firstName, lastName, password, role]
  );
  return userResult.insertId;
};

// Helper Function to Insert Role-Specific Table (Agent, Player, SuperAgent, etc.)
const insertRoleSpecificData = async (
  connection, 
  userId, 
  agentDbId, 
  clientBalance, 
  share, 
  userLotteryCommission, 
  userCasinoCommission, 
  role
) => {
  const insertMap = {
    PLAYER: `INSERT INTO players (userId, agentId, balance, share, lotteryCommission, casinoCommission) 
             VALUES (?, ?, ?, ?, ?, ?)`,
    AGENT: `INSERT INTO agents (userId, superAgentsId, balance, maxShare, maxCasinoCommission, maxLotteryCommission) 
            VALUES (?, ?, ?, ?, ?, ?)`,
    SUPERAGENT: `INSERT INTO superAgents (userId, balance) VALUES (?, ?)`, // Placeholder for future use
  };

  const query = insertMap[role];
  
  if (!query) {
    throw new Error(`Unsupported role: ${role}`);
  }

  if (role === 'PLAYER') {
    await connection.query(query, [
      userId,
      agentDbId,
      clientBalance,
      share,
      userLotteryCommission,
      userCasinoCommission
    ]);
  } else if (role === 'AGENT') {
    await connection.query(query, [
      userId,
      agentDbId,
      clientBalance,
      share,
      userCasinoCommission,
      userLotteryCommission
    ]);
  } else if (role === 'SUPERAGENT') {
    await connection.query(query, [userId, clientBalance]);
  }
};

// API to Register a Client (Agent registering Player, SuperAgent registering Agent)
export const registerClient = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Extract request body
    const {
      userId: generatedUserId,
      firstName,
      lastName,
      fixLimit,
      maxShare: share,
      userCasinoCommission = 0,
      userLotteryCommission = 0,
      password,
    } = req.body;

    const requesterId = req.session.userId; // ID of the user making the request
    const clientBalance = Number(fixLimit) || 0; // Default balance

    // Validate required fields
    if (
      !generatedUserId ||
      !password ||
      !firstName ||
      fixLimit === undefined ||
      share === undefined
    ) {
      return res.status(400).json({
        uniqueCode: "CGP01R01",
        message: "All fields are required",
        data: {},
      });
    }

    if (!isAlphabetic(firstName) || (lastName && !isAlphabetic(lastName))) {
      return res.status(400).json({
        uniqueCode: "CGP01R02",
        message: "First name and Last name should only contain alphabets",
        data: {},
      });
    }

    // Fetch requester details (to check if they are AGENT, SUPERAGENT, etc.)
    const [requesterResult] = await connection.query(
      `SELECT id, role FROM users WHERE id = ?`,
      [requesterId]
    );

    if (requesterResult.length === 0) {
      return res.status(403).json({
        uniqueCode: "CGP01R03",
        message: "Requester not found or unauthorized",
        data: {},
      });
    }

    const { id: requesterDbId, role: requesterRole } = requesterResult[0];

    // Check if the username already exists
    const [existingUser] = await connection.query(
      "SELECT username FROM users WHERE username = ?",
      [generatedUserId]
    );
    if (existingUser.length) {
      return res.status(409).json({
        uniqueCode: "CGP01R09",
        message: "Username already exists",
        data: {},
      });
    }

    // Fetch requester specific details (Agent or Super-Agent)
    const userInfo = await getUserInfo(connection, requesterRole, requesterDbId);

    if (!userInfo) {
      return res.status(403).json({
        uniqueCode: "CGP01R03",
        message: `${requesterRole} not found or unauthorized`,
        data: {},
      });
    }

    // Validate Share and Commissions for AGENT registering PLAYER
    if (requesterRole === 'AGENT') {
      if (Number(share) > Number(userInfo.maxShare)) {
        return res.status(403).json({
          uniqueCode: "CGP01R05",
          message: "Share must match the agent's maximum allowed share",
          data: {},
        });
      }
      if (Number(userCasinoCommission) > Number(userInfo.maxCasinoCommission)) {
        return res.status(403).json({
          uniqueCode: "CGP01R07",
          message: "Casino Commission must match the agent's maximum",
          data: {},
        });
      }
      if (Number(userLotteryCommission) > Number(userInfo.maxLotteryCommission)) {
        return res.status(403).json({
          uniqueCode: "CGP01R08",
          message: "Lottery Commission must match the agent's maximum",
          data: {},
        });
      }
    }

    // Check balance for agent or super-agent
    if (userInfo.balance < clientBalance) {
      await connection.rollback();
      return res.status(403).json({
        uniqueCode: "CGP01R12",
        message: "Insufficient balance: Agent's balance cannot go negative",
        data: {},
      });
    }

    // Deduct balance from agent or super-agent
    await deductBalance(connection, clientBalance, requesterId, requesterRole);

    // Insert new user (either Agent or Player)
    const newUserId = await insertUser(connection, generatedUserId, firstName, lastName, password, requesterRole === 'AGENT' ? 'PLAYER' : 'AGENT');

    // Insert into Player or Agent table (or SuperAgent if necessary)
    await insertRoleSpecificData(
      connection, 
      newUserId, 
      userInfo.id, 
      clientBalance, 
      share, 
      userLotteryCommission, 
      userCasinoCommission, 
      requesterRole === 'AGENT' ? 'PLAYER' : 'AGENT'
    );

    // Update wallet info
    socketManager.broadcastWalletUpdate(requesterId, userInfo.balance - clientBalance);

    await connection.commit();
    return res.status(200).json({
      uniqueCode: "CGP01R10",
      message: "User registered successfully",
      data: {},
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({
      uniqueCode: "CGP01R11",
      message: "Internal server error",
      data: { error: error.message },
    });
  } finally {
    connection.release();
  }
};
