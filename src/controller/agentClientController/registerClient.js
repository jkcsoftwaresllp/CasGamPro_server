import { pool } from "../../config/db.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

// Utility Function
const isAlphabetic = (value) => /^[A-Za-z]+$/.test(value);

// API to Register a New Client for an Agent
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
      userCasinoCommission: casinoCommission,
      userLotteryCommission: lotteryCommission,
      userSessionCommission: sessionCommission,
      password,
    } = req.body;

    const agentId = req.session.userId;

    // Validate required fields
    if (
      !generatedUserId ||
      !password ||
      !firstName ||
      !lastName ||
      fixLimit === undefined ||
      share === undefined ||
      casinoCommission === undefined ||
      lotteryCommission === undefined ||
      sessionCommission === undefined
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

    // Fetch agent details
    const [agentResult] = await connection.query(
      `SELECT id, balance, maxCasinoCommission, maxLotteryCommission, maxSessionCommission, maxShare 
       FROM agents WHERE userId = ?`,
      [agentId]
    );

    if (agentResult.length === 0) {
      return res.status(403).json({
        uniqueCode: "CGP01R03",
        message: "Agent not found or unauthorized",
        data: {},
      });
    }

    const {
      id: correctAgentId,
      balance,
      maxCasinoCommission,
      maxLotteryCommission,
      maxSessionCommission,
      maxShare,
    } = agentResult[0];

    // Fetch total client balance under the agent
    const [totalClientBalanceResult] = await connection.query(
      `SELECT SUM(balance) AS totalClientBalance FROM players WHERE agentId = ?`,
      [correctAgentId]
    );

    const totalClientBalance =
      totalClientBalanceResult[0].totalClientBalance || 0;
    const newTotalBalance = totalClientBalance + Number(fixLimit);

    // Ensure that total client balance never exceeds agent's wallet
    if (newTotalBalance > balance) {
      return res.status(403).json({
        uniqueCode: "CGP01R04",
        message:
          "Agent's wallet balance is insufficient to register this client",
        data: {},
      });
    }

    // Validate Share and Commissions
    if (Number(share) !== Number(maxShare)) {
      return res.status(403).json({
        uniqueCode: "CGP01R05",
        message: "Share must match the agent's maximum allowed share",
        data: {},
      });
    }
    if (Number(sessionCommission) !== Number(maxSessionCommission)) {
      return res.status(403).json({
        uniqueCode: "CGP01R06",
        message: "Session Commission must match the agent's maximum",
        data: {},
      });
    }
    if (Number(casinoCommission) !== Number(maxCasinoCommission)) {
      return res.status(403).json({
        uniqueCode: "CGP01R07",
        message: "Casino Commission must match the agent's maximum",
        data: {},
      });
    }
    if (Number(lotteryCommission) !== Number(maxLotteryCommission)) {
      return res.status(403).json({
        uniqueCode: "CGP01R08",
        message: "Lottery Commission must match the agent's maximum",
        data: {},
      });
    }

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

    // Insert User
    const insertUserQuery = `
        INSERT INTO users (username, firstName, lastName, password, role, blocking_levels)
        VALUES (?, ?, ?, ?, 'PLAYER', 'NONE')`;
    const [userResult] = await connection.query(insertUserQuery, [
      generatedUserId,
      firstName,
      lastName,
      password,
    ]);

    const userId = userResult.insertId;

    // Insert Player
    const insertPlayerQuery = `
      INSERT INTO players (userId, agentId, balance, fixLimit, share, lotteryCommission, casinoCommission, sessionCommission)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await connection.query(insertPlayerQuery, [
      userId,
      correctAgentId,
      fixLimit,
      fixLimit,
      share,
      lotteryCommission,
      casinoCommission,
      sessionCommission,
    ]);

    // Deduct FixLimit from Agent's Wallet
    const [walletCheck] = await connection.query(
      "SELECT balance FROM agents WHERE userId = ?",
      [agentId]
    );

    if (walletCheck.length === 0 || walletCheck[0].balance < fixLimit) {
      await connection.rollback();
      return res.status(403).json({
        uniqueCode: "CGP01R12",
        message: "Insufficient balance: Agent's balance cannot go negative",
        data: {},
      });
    }

    await connection.query(
      "UPDATE agents SET balance = balance - ? WHERE userId = ? AND balance >= ?",
      [fixLimit, agentId, fixLimit]
    );

    await connection.commit();
    return res.status(200).json({
      uniqueCode: "CGP01R10",
      message: "Client registered successfully",
      data: {
        clientId: generatedUserId,
        maxShareLimit: maxShare,
        maxCasinoCommission,
        maxLotteryCommission,
      },
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      uniqueCode: "CGP01R11",
      message: "Internal server error",
      data: { error: error.message },
    });
  } finally {
    connection.release();
  }
};
