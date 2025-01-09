import pool from '../config/db.js';
import crypto from 'crypto';

// To generate a random 8-character password
const generatePassword = () => {
  return crypto.randomBytes(4).toString('hex');
};

// Generate userId with firstName and datetime
const generateUserId = (firstName) => {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, ''); // Get HHMMSS
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
    } = req.body;

	  const agentId = 1; // Hardcoded for now

    // Validation checks
    if (!firstName || !lastName || fixLimit === undefined ||
        matchShare === undefined || sessionCommission === undefined ||
        lotteryCommission === undefined || !agentId) {
      return res.status(400).json({
        uniqueCode: 'CGP0010A',
        message: 'All fields are required'
      });
    }

    if (!isAlphabetic(firstName)) {
      return res.status(400).json({
        uniqueCode: 'CGP0011A',
        message: 'First name should only contain alphabets'
      });
    }

    if (!isAlphabetic(lastName)) {
      return res.status(400).json({
        uniqueCode: 'CGP0011B',
        message: 'Last name should only contain alphabets'
      });
    }

    if (!isNumeric(fixLimit) || fixLimit < 0 || fixLimit > 18) {
      return res.status(400).json({
        uniqueCode: 'CGP0010B',
        message: 'Fix Limit must be a numeric value between 0 and 18'
      });
    }

    if (!isNumeric(matchShare) || matchShare < 0 || matchShare > 3) {
      return res.status(400).json({
        uniqueCode: 'CGP0010C',
        message: 'Match Share must be a numeric value between 0 and 3'
      });
    }

    if (!isNumeric(sessionCommission) || sessionCommission < 0 || sessionCommission > 3) {
      return res.status(400).json({
        uniqueCode: 'CGP0010D',
        message: 'Session Commission must be a numeric value between 0 and 3'
      });
    }

    const password = generatePassword();
    const userId = generateUserId(firstName);

    // Insert into users table
    const insertUserQuery = `
      INSERT INTO users (userId, firstName, lastName, password, blocked, role)
      VALUES (?, ?, ?, ?, false, 'PLAYER')
    `;

    const [userResult] = await connection.query(insertUserQuery, [
      userId,
      firstName,
      lastName,
      password
    ]);

    // Insert into players table
    const insertPlayerQuery = `
      INSERT INTO players (userId, agentId, balance, fixLimit, matchShare, sessionCommission, lotteryCommission)
      VALUES (?, ?, 0, ?, ?, ?, ?)
    `;

    await connection.query(insertPlayerQuery, [
      userResult.insertId,
      agentId,
      fixLimit,
      matchShare,
      sessionCommission,
      lotteryCommission
    ]);

    await connection.commit();

    return res.status(201).json({
      uniqueCode: 'CGP0001',
      message: 'Player registered successfully',
      userId: userId,
      password: password
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error registering player:', error);
    res.status(500).json({
      uniqueCode: 'CGP0002',
      message: 'Internal server error'
    });
  } finally {
    connection.release();
  }
};
