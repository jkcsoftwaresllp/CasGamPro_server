import { db } from "../../../config/db.js";
import { users, agents, super_agents } from "../../../database/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../../../logger/logger.js";
import redis from "../../../config/redis.js";

export const getBettingRange = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    logger.info(`Fetching betting range for userId: ${userId}`);

    //  Step 2: Check if betting range exists in Redis cache
    let bettingRange = await redis.get(`betting-range:${userId}`);
    if (bettingRange) {
      logger.info(`Cache hit for userId: ${userId}`);
      return JSON.parse(bettingRange);
    }
    // 🔹 Step 3: Fetch Agent ID and linked Super-Agent ID

    const agentData = await db
      .select({
        agentId: agents.id,
        superAgentId: agents.superAgentId,
      })
      .from(agents)
      .where(eq(agents.userId, userId))
      .limit(1);

    if (!agentData.length || !agentData[0].superAgentId) {
      throw new Error(
        `Agent or linked Super-Agent not found for userId: ${userId}`
      );
    }

    const { superAgentId } = agentData[0];

    // 🔹 Step 4: Fetch the min/max betting limits from the Super-Agent table
    const superAgentData = await db
      .select({
        minBet: super_agents.minBet,
        maxBet: super_agents.maxBet,
      })
      .from(super_agents)
      .where(eq(super_agents.id, superAgentId))
      .limit(1);

    if (!superAgentData.length) {
      throw new Error(
        `Betting limits not found for Super-Agent ID: ${superAgentId}`
      );
    }

    const { minBet, maxBet } = superAgentData[0];
    if (minBet === undefined || maxBet === undefined) {
      throw new Error("Invalid betting range values");
    }
    // 🔹 Step 5: Cache the result in Redis for 10 minutes

    await redis.setex(
      `betting-range:${userId}`,
      600,
      JSON.stringify({ minBet, maxBet })
    );

    return { minBet, maxBet };
  } catch (error) {
    logger.error("Error fetching betting range:", error);
    throw new Error(error.message);
  }
};

// Validate if a bet amount is within the configured range
export const validateBetAmount = async (userId, betAmount) => {
  try {
    // Fetch the betting range
    const bettingRange = await getBettingRange(userId);
    if (!bettingRange) {
      throw new Error("Betting range not found");
    }

    const { minBet, maxBet } = bettingRange;

    if (betAmount < minBet || betAmount > maxBet) {
      return {
        uniqueCode: "CGP00G10",
        message: `Bet amount must be between ${minBet} and ${maxBet}.`,
        data: {
          status: "error",
          success: false,
        },
      };
    }

    // If valid, return success
    return {
      uniqueCode: "CGP00G11",
      message: "Bet amount is within the valid range.",
      data: {
        status: success,
        success: true,
      },
    };
  } catch (error) {
    return {
      uniqueCode: "CGP00G12",
      message: error.message,
      data: {
        status: "error",
        success: false,
      },
    };
  }
};
