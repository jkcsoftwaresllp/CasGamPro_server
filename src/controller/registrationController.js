import { db } from "../config/db.js";
import { users, user_limits_commissions } from "../database/schema.js";
import { Roles } from "../database/modals/doNotChangeOrder.helper.js";
import { logger } from "../logger/logger.js";
import { createResponse } from "../helper/responseHelper.js";
import { generateUserId } from "../utils/generateUserId.js";

// Utility Functions
const isAlphabetic = (value) => /^[A-Za-z]+$/.test(value);
const isNumeric = (value) => !isNaN(value) && !isNaN(parseFloat(value));

// Role hierarchy validation
const ROLE_HIERARCHY = {
  SUPERADMIN: ["ADMIN"],
  ADMIN: ["SUPERAGENT"],
  SUPERAGENT: ["AGENT"],
  AGENT: ["PLAYER"],
};

// Validate if parent can create child with given role
const canCreateRole = (parentRole, childRole) => {
  return ROLE_HIERARCHY[parentRole]?.includes(childRole);
};

export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      password,
      role,
      minBet = 0,
      maxBet = 0,
      maxShare = 0,
      maxCasinoCommission = 0,
      maxLotteryCommission = 0,
      maxSessionCommission = 0,
      balance = 0,
    } = req.body;

    const parentId = req.session.userId;

    // Validate required fields
    if (!firstName || !password || !role) {
      return res.status(400).json(
        createResponse("error", "CGP0018", "Missing required fields")
      );
    }

    // Validate name format
    if (!isAlphabetic(firstName) || (lastName && !isAlphabetic(lastName))) {
      return res.status(400).json(
        createResponse(
          "error",
          "CGP0019",
          "First name and last name must contain only alphabets"
        )
      );
    }

    // Validate numeric fields
    if (!isNumeric(minBet) || !isNumeric(maxBet) || !isNumeric(maxShare)) {
      return res.status(400).json(
        createResponse("error", "CGP0007", "Invalid numeric values provided")
      );
    }

    // Get parent user details
    const parent = await db
      .select()
      .from(users)
      .where(users.id.eq(parentId))
      .limit(1);

    if (!parent.length) {
      return res.status(404).json(
        createResponse("error", "CGP0008", "Parent user not found")
      );
    }

    // Validate role hierarchy
    if (!canCreateRole(parent[0].role, role)) {
      return res.status(403).json(
        createResponse(
          "error",
          "CGP0009",
          `${parent[0].role} cannot create ${role}`
        )
      );
    }

    // Generate unique userId
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
      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          parent_id: parentId,
          username,
          first_name: firstName,
          last_name: lastName || null,
          password,
          role,
          balance,
        })
        .execute();

      // Add limits and commissions
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