import { db } from "../../config/db.js";
import { logger } from "../../logger/logger.js";
import { user_limits_commissions } from "../schema.js";

// Seed function for user_limits_commissions
export const seedUserLimitsCommissions = async () => {
  logger.info("Seeding user_limits_commissions data...");

  try {
    // Fetch all users
    const users = await db.select().from("users");

    // Prepare user limits and commissions data
    const limitsData = users.map((user) => ({
      user_id: user.id,
      min_bet: 10, // Default min bet
      max_bet: 10000, // Default max bet
      max_share: 50.0, // Default share limit
      max_casino_commission: 5.0, // Default casino commission
      max_lottery_commission: 3.0, // Default lottery commission
      max_session_commission: 2.0, // Default session commission
    }));

    // Insert into user_limits_commissions table
    await db.insert(user_limits_commissions).values(limitsData);

    logger.info("user_limits_commissions table seeded successfully.");
  } catch (error) {
    logger.error("Error seeding user_limits_commissions table:", error);
  }
};
