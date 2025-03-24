import { db } from "../config/db.js";
import { users, user_limits_commissions, ledger } from "../database/schema.js";
import { ROLES } from "../database/modals/doNotChangeOrder.helper.js";
import { logger } from "../logger/logger.js";
import { createResponse } from "../helper/responseHelper.js";
import { generateUserId } from "../utils/generateUserId.js";
import { eq } from "drizzle-orm";
import { transferBalance } from "../database/queries/panels/transferBalance.js";

// Utility Functions
const isAlphabetic = (value) => /^[A-Za-z]+$/.test(value);
const isNumeric = (value) => !isNaN(value) && !isNaN(parseFloat(value));

export const registerUser = async (req, res) => {
  try {
    const {
      userId,
      firstName,
      lastName,
      password,
      minBet = 0,
      maxBet = 0,
      maxShare = 0,
      maxCasinoCommission = 0,
      maxLotteryCommission = 0,
      maxSessionCommission = 0,
      fixLimit: balance = 0,
    } = req.body;

    const ownerId = req.session.userId;
    if (!firstName || !password || !userId) {
      return res
        .status(400)
        .json(createResponse("error", "CGP0018", "Missing required fields"));
    }

    if (!isAlphabetic(firstName) || (lastName && !isAlphabetic(lastName))) {
      return res
        .status(400)
        .json(
          createResponse(
            "error",
            "CGP0019",
            "First name and last name must contain only alphabets"
          )
        );
    }

    if (!isNumeric(minBet) || !isNumeric(maxBet) || !isNumeric(maxShare)) {
      return res
        .status(400)
        .json(
          createResponse("error", "CGP0007", "Invalid numeric values provided")
        );
    }

    // Get parent user details
    const [parent] = await db
      .select()
      .from(users)
      .where(eq(users.id, ownerId))
      .limit(1);

    if (!parent) {
      return res
        .status(404)
        .json(createResponse("error", "CGP0008", "Parent user not found"));
    }

    const parentRole = parent.role;
    const roleIndex = ROLES.indexOf(parentRole);

    if (roleIndex === -1 || roleIndex === ROLES.length - 1) {
      return res
        .status(403)
        .json(
          createResponse(
            "error",
            "CGP0013",
            "Invalid parent role or cannot create further roles"
          )
        );
    }

    const childRole = ROLES[roleIndex + 1];

    // Generate unique user ID if already exists
    let newUserId = userId;
    const ownerName = req.session.clientName;
    let userExists = true;

    while (userExists) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, newUserId))
        .limit(1);

      if (existingUser.length === 0) {
        userExists = false;
      } else {
        newUserId = generateUserId(ownerName);
      }
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Insert new user
      await tx.insert(users).values({
        parent_id: ownerId,
        id: newUserId,
        first_name: firstName,
        last_name: lastName || null,
        password,
        role: childRole,
        balance,
      });

      // Insert user commissions and limits
      await tx.insert(user_limits_commissions).values({
        user_id: newUserId,
        min_bet: minBet,
        max_bet: maxBet,
        max_share: maxShare,
        max_casino_commission: maxCasinoCommission || 0,
        max_lottery_commission: maxLotteryCommission || 0,
        max_session_commission: maxSessionCommission || 0,
      });

      const userEntry = `Account Opening by ${ownerName} (${ownerId}) of ${firstName} ${lastName}`;
      const ownerEntry = `Balance deducted for creating user ${firstName} ${lastName} (${userId})`;

      // Insert ledger entry for new user
      await tx.insert(ledger).values({
        user_id: newUserId,
        round_id: "null",
        transaction_type: "DEPOSIT",
        entry: userEntry,
        amount: 0,
        previous_balance: 0,
        new_balance: 0,
        stake_amount: 0,
        result: null,
        status: "PAID",
        description: userEntry,
      });

      if (balance > 0) {
        const transferResult = await transferBalance({
          transaction: tx,
          ownerId,
          balance,
          userId: newUserId,
          userEntry,
          ownerEntry,
        });

        if (!transferResult.success) {
          return res
            .status(403)
            .json(createResponse("failed", "CGP0079", transferResult.msg, {}));
        }
      }
    });

    return res.status(201).json(
      createResponse("success", "CGP0011", "User registered successfully", {
        userId: newUserId,
        username: newUserId,
      })
    );
  } catch (error) {
    logger.error("Registration error:", error);
    return res.status(500).json(
      createResponse("error", "CGP0012", "Internal server error", {
        error: error.message,
      })
    );
  }
};
