import { pool } from "../../config/db.js";
import socketManager from "../../services/shared/config/socket-manager.js";

// Utility Function
const isAlphabetic = (value) => /^[A-Za-z]+$/.test(value);

// API to Register an Agent (by SuperAgent) or a Player (by Agent)
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

    // Fetch requester details (to check if they are SUPERAGENT or AGENT)
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

    // **AGENT REGISTERING A PLAYER**
    if (requesterRole === "AGENT") {
      // Fetch agent details
      const [agentResult] = await connection.query(
        `SELECT id, balance, maxCasinoCommission, maxLotteryCommission, maxShare FROM agents WHERE userId = ?`,
        [requesterDbId]
      );

      if (agentResult.length === 0) {
        return res.status(403).json({
          uniqueCode: "CGP01R03",
          message: "Agent not found or unauthorized",
          data: {},
        });
      }

      const {
        id: agentDbId,
        balance,
        maxCasinoCommission,
        maxLotteryCommission,
        maxShare,
      } = agentResult[0];

      // Validate Share and Commissions
      if (Number(share) > Number(maxShare)) {
        return res.status(403).json({
          uniqueCode: "CGP01R05",
          message: "Share must match the agent's maximum allowed share",
          data: {},
        });
      }
      if (Number(userCasinoCommission) > Number(maxCasinoCommission)) {
        return res.status(403).json({
          uniqueCode: "CGP01R07",
          message: "Casino Commission must match the agent's maximum",
          data: {},
        });
      }
      if (Number(userLotteryCommission) > Number(maxLotteryCommission)) {
        return res.status(403).json({
          uniqueCode: "CGP01R08",
          message: "Lottery Commission must match the agent's maximum",
          data: {},
        });
      }

      // Check agent's balance
      if (balance < clientBalance) {
        await connection.rollback();
        return res.status(403).json({
          uniqueCode: "CGP01R12",
          message: "Insufficient balance: Agent's balance cannot go negative",
          data: {},
        });
      }

      // Deduct balance from agent
      await connection.query(
        "UPDATE agents SET balance = balance - ? WHERE userId = ?",
        [clientBalance, requesterId]
      );

      // Insert new user
      const [userResult] = await connection.query(
        `INSERT INTO users (username, firstName, lastName, password, role, blocking_levels) 
         VALUES (?, ?, ?, ?, 'PLAYER', 'NONE')`,
        [generatedUserId, firstName, lastName, password]
      );
      const newUserId = userResult.insertId;

      // Insert into players table
      await connection.query(
        `INSERT INTO players (userId, agentId, balance, share, lotteryCommission, casinoCommission) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newUserId,
          agentDbId,
          clientBalance,
          share,
          userLotteryCommission,
          userCasinoCommission,
        ]
      );

      socketManager.broadcastWalletUpdate(requesterId, balance - clientBalance);
    }

    // **SUPERAGENT REGISTERING AN AGENT**
    else if (requesterRole === "SUPERAGENT") {
      // Fetch super-agent details
      const [superAgentResult] = await connection.query(
        `SELECT id, balance FROM superAgents WHERE userId = ?`,
        [requesterId]
      );

      if (superAgentResult.length === 0) {
        return res.status(403).json({
          uniqueCode: "CGP01R03",
          message: "Super-Agent not found or unauthorized",
          data: {},
        });
      }

      const { id: superAgentDbId, balance } = superAgentResult[0];

      // Deduct balance from super-agent
      await connection.query(
        "UPDATE superAgents SET balance = balance - ? WHERE userId = ?",
        [clientBalance, requesterId]
      );

      // Insert new user
      const [userResult] = await connection.query(
        `INSERT INTO users (username, firstName, lastName, password, role, blocking_levels) 
         VALUES (?, ?, ?, ?, 'AGENT', 'NONE')`,
        [generatedUserId, firstName, lastName, password]
      );
      const newUserId = userResult.insertId;

      // Insert into agents table
      await connection.query(
        `INSERT INTO agents (userId, superAgentsId, balance, maxShare, maxCasinoCommission, maxLotteryCommission) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newUserId,
          superAgentDbId,
          clientBalance,
          share,
          casinoCommission,
          lotteryCommission,
        ]
      );

      socketManager.broadcastWalletUpdate(requesterId, balance - clientBalance);
    }

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
