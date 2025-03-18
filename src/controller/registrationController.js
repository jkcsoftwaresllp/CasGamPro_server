import { db } from "../config/db.js";
import { users, user_limits_commissions } from "../database/schema.js";
import { ROLES } from "../database/modals/doNotChangeOrder.helper.js";
import { logger } from "../logger/logger.js";
import { createResponse } from "../helper/responseHelper.js";
import { generateUserId } from "../utils/generateUserId.js";

// Utility Functions
const isAlphabetic = (value) => /^[A-Za-z]+$/.test(value);
const isNumeric = (value) => !isNaN(value) && !isNaN(parseFloat(value));

export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      password,
      minBet = 0,
      maxBet = 0,
      maxShare = 0,
      maxCasinoCommission = 0,
      maxLotteryCommission = 0,
      maxSessionCommission = 0,
      balance = 0,
    } = req.body;

    const parentId = req.session.userId;

    if (!firstName || !password) {
      return res.status(400).json(
        createResponse("error", "CGP0018", "Missing required fields")
      );
    }

    if (!isAlphabetic(firstName) || (lastName && !isAlphabetic(lastName))) {
      return res.status(400).json(
        createResponse(
          "error",
          "CGP0019",
          "First name and last name must contain only alphabets"
        )
      );
    }

    if (!isNumeric(minBet) || !isNumeric(maxBet) || !isNumeric(maxShare)) {
      return res.status(400).json(
        createResponse("error", "CGP0007", "Invalid numeric values provided")
      );
    }

    // Get parent user details
    const [parent] = await db
      .select()
      .from(users)
      .where(users.id.eq(parentId))
      .limit(1);

    if (!parent) {
      return res.status(404).json(
        createResponse("error", "CGP0008", "Parent user not found")
      );
    }

    const parentRole = parent.role;
    const roleIndex = ROLES.indexOf(parentRole);

    if (roleIndex === -1 || roleIndex === ROLES.length - 1) {
      return res.status(403).json(
        createResponse("error", "CGP0013", "Invalid parent role or cannot create further roles")
      );
    }

    // Assign child role based on the next role in the hierarchy from the database
    const childRole = ROLES[roleIndex + 1];

    const username = generateUserId(firstName);

    // Check if username exists
    const existingUser = await db
      .select()
      .from(users)
      .where(users.username.eq(username))
      .limit(1);

    if (existingUser.length) {
      return res.status(409).json(
        createResponse("error", "CGP0010", "Username already exists")
      );
    }

    // Start transaction
    const connection = await db.connection();
    await connection.beginTransaction();

    try {
      const [newUser] = await db
        .insert(users)
        .values({
          parent_id: parentId,
          username,
          first_name: firstName,
          last_name: lastName || null,
          password,
          role: childRole,
          balance,
        })
        .execute();

      await db.insert(user_limits_commissions).values({
        user_id: newUser.insertId,
        min_bet: minBet,
        max_bet: maxBet,
        max_share: maxShare,
        max_casino_commission: maxCasinoCommission,
        max_lottery_commission: maxLotteryCommission,
        max_session_commission: maxSessionCommission,
      });

      await connection.commit();

      return res.status(201).json(
        createResponse("success", "CGP0011", "User registered successfully", {
          userId: newUser.insertId,
          username,
        })
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    logger.error("Registration error:", error);
    return res.status(500).json(
      createResponse("error", "CGP0012", "Internal server error", {
        error: error.message,
      })
    );
  }
};
