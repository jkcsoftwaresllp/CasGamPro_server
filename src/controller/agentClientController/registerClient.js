import { pool } from "../../config/db.js";
import socketManager from "../../services/shared/config/socket-manager.js";

// Utility Function
const isAlphabetic = (value) => /^[A-Za-z]+$/.test(value);

// Common function to register a client (player or agent)
const registerClientByRole = async (connection, role, requesterId, requesterDbId, generatedUserId, firstName, lastName, password, fixLimit, maxShare, userCasinoCommission, userLotteryCommission) => {
  const clientBalance = Number(fixLimit) || 0; // Default balance

  let table, agentColumn, commissionColumn, userTable, userInsertQuery, balanceColumn;
  let agentBalanceColumn, commissionCheckQuery, insertQuery, commissionChecks;

  if (role === "AGENT") {
    table = "agents";
    agentColumn = "id";
    commissionColumn = "maxShare";
    userTable = "players";
    balanceColumn = "balance";
    userInsertQuery = `INSERT INTO users (username, firstName, lastName, password, role, blocking_levels) VALUES (?, ?, ?, ?, 'PLAYER', 'NONE')`;
    commissionCheckQuery = `
      SELECT balance, maxCasinoCommission, maxLotteryCommission, maxShare FROM agents WHERE userId = ?`;
    insertQuery = `INSERT INTO players (userId, agentId, balance, share, lotteryCommission, casinoCommission) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    commissionChecks = [userCasinoCommission, userLotteryCommission];
  } else if (role === "SUPERAGENT") {
    table = "superAgents";
    agentColumn = "id";
    commissionColumn = "balance";
    userTable = "agents";
    balanceColumn = "balance";
    userInsertQuery = `INSERT INTO users (username, firstName, lastName, password, role, blocking_levels) VALUES (?, ?, ?, ?, 'AGENT', 'NONE')`;
    commissionCheckQuery = `SELECT balance FROM superAgents WHERE userId = ?`;
    insertQuery = `INSERT INTO agents (userId, superAgentsId, balance, maxShare, maxCasinoCommission, maxLotteryCommission) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    commissionChecks = [userCasinoCommission, userLotteryCommission];
  }

  // Fetch requester details
  const [requesterResult] = await connection.query(
    `SELECT id, role FROM users WHERE id = ?`,
    [requesterId]
  );

  if (requesterResult.length === 0) {
    throw { uniqueCode: "CGP01R03", message: "Requester not found or unauthorized" };
  }

  const { id: requesterDbId, role: requesterRole } = requesterResult[0];

  // Fetch the relevant details from the corresponding table (agents or superagents)
  const [result] = await connection.query(commissionCheckQuery, [requesterDbId]);

  if (result.length === 0) {
    throw { uniqueCode: "CGP01R03", message: `${role} not found or unauthorized` };
  }

  const { balance, maxCasinoCommission, maxLotteryCommission, maxShare } = result[0];

  // Validate Share and Commissions
  if (Number(maxShare) !== Number(share)) {
    throw { uniqueCode: "CGP01R05", message: "Share must match the agent's maximum allowed share" };
  }
  if (Number(userCasinoCommission) !== Number(maxCasinoCommission)) {
    throw { uniqueCode: "CGP01R07", message: "Casino Commission must match the agent's maximum" };
  }
  if (Number(userLotteryCommission) !== Number(maxLotteryCommission)) {
    throw { uniqueCode: "CGP01R08", message: "Lottery Commission must match the agent's maximum" };
  }

  // Check the agent or super-agent balance
  if (balance < clientBalance) {
    throw { uniqueCode: "CGP01R12", message: `Insufficient balance: ${role}'s balance cannot go negative` };
  }

  // Deduct balance from agent or super-agent
  const deductQuery = `UPDATE ${table} SET balance = balance - ? WHERE userId = ?`;
  await connection.query(deductQuery, [clientBalance, requesterId]);

  // Check if the username already exists
  const [existingUser] = await connection.query(
    "SELECT username FROM users WHERE username = ?",
    [generatedUserId]
  );
  if (existingUser.length) {
    throw { uniqueCode: "CGP01R09", message: "Username already exists" };
  }

  // Insert the user into the users table
  const [userResult] = await connection.query(userInsertQuery, [generatedUserId, firstName, lastName, password]);
  const newUserId = userResult.insertId;

  // Insert into corresponding table (players or agents)
  await connection.query(insertQuery, [
    newUserId,
    role === "AGENT" ? agentDbId : superAgentDbId, 
    clientBalance,
    share,
    userLotteryCommission,
    userCasinoCommission,
  ]);

  return { balance: balance - clientBalance, message: `${role} registered successfully` };
};

// API to Register an Agent (by SuperAgent) or a Player (by Agent)
export const registerClient = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Extract request body
    const { userId: generatedUserId, firstName, lastName, fixLimit, maxShare: share, userCasinoCommission = 0, userLotteryCommission = 0, password } = req.body;

    const requesterId = req.session.userId; // ID of the user making the request

    // Validate required fields
    if (!generatedUserId || !password || !firstName || fixLimit === undefined || share === undefined) {
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

    // Determine if the requester is an AGENT or SUPERAGENT
    const [requesterResult] = await connection.query(
      `SELECT id, role FROM users WHERE id = ?`,
      [requesterId]
    );

    const { id: requesterDbId, role: requesterRole } = requesterResult[0];

    // Call the common registration function
    const result = await registerClientByRole(connection, requesterRole, requesterId, requesterDbId, generatedUserId, firstName, lastName, password, fixLimit, share, userCasinoCommission, userLotteryCommission);

    // Broadcast wallet update
    socketManager.broadcastWalletUpdate(requesterId, result.balance);

    await connection.commit();
    return res.status(200).json({
      uniqueCode: "CGP01R10",
      message: result.message,
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
