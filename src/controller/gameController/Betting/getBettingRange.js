import { db } from "../../../config/db.js";
import { users } from "../../../database/schema.js";
import { eq } from "drizzle-orm";

import {
  logToFolderInfo,
  logToFolderError,
} from "../../../utils/logToFolder.js";
import redis from "../../../config/redis.js";

export const getBettingRange = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const logInfo = { action: "getBettingRange", userId };
    logToFolderInfo("Client/controller", "getBettingRange", {
      message: `Fetching betting range for userId: ${userId}`,
    });

    //  Step 2: Check if betting range exists in Redis cache
    let bettingRange = await redis.get(`betting-range:${userId}`);
    if (bettingRange) {
      logToFolderInfo("Client/controller", "getBettingRange", {
        message: `Cache hit for userId: ${userId}`,
      });
      return JSON.parse(bettingRange);
    }

    // // 🔹 Step 3: Fetch Agent ID and linked Super-Agent ID // TODO
    // const agentData = await db
    //   .select({
    //     agentId: agents.id,
    //     superAgentId: agents.superAgentId,
    //   })
    //   .from(agents)
    //   .where(eq(agents.userId, userId))
    //   .limit(1);

    // if (!agentData.length || !agentData[0].superAgentId) {
    //   throw new Error(
    //     `Agent or linked Super-Agent not found for userId: ${userId}`
    //   );
    // }

    // const { superAgentId } = agentData[0];

    // // 🔹 Step 4: Fetch the min/max betting limits from the Super-Agent table  // TODO
    // const superAgentData = await db
    //   .select({
    //     minBet: super_agents.minBet,
    //     maxBet: super_agents.maxBet,
    //   })
    //   .from(super_agents)
    //   .where(eq(super_agents.id, superAgentId))
    //   .limit(1);

    // if (!superAgentData.length) {
    //   throw new Error(
    //     `Betting limits not found for Super-Agent ID: ${superAgentId}`
    //   );
    // }

    // const { minBet, maxBet } = superAgentData[0];
    const minBet = 0,
      maxBet = 5000; // TODO
    if (minBet === undefined || maxBet === undefined) {
      throw new Error("Invalid betting range values");
    }
    // 🔹 Step 5: Cache the result in Redis for 10 minutes

    await redis.setex(
      `betting-range:${userId}`,
      600,
      JSON.stringify({ minBet, maxBet })
    );
    logToFolderInfo("Client/controller", "getBettingRange", {
      message: `Betting range cached for userId: ${userId}`,
    });

    return { minBet, maxBet };
  } catch (error) {
    logToFolderError("Client/controller", "getBettingRange", {
      message: `Error fetching betting range for userId: ${userId}`,
      error: error.message,
    });
    throw new Error(error.message);
  }
};

// Validate if a bet amount is within the configured range
export const validateBetAmount = async (userId, betAmount) => {
  try {
    // Fetch the betting range
    // const { minBet, maxBet } = await getBettingRange(userId);
    const minBet = 0;
    const maxBet = 50000;

    // Check if the bet amount is within the valid range
    // if (betAmount < minBet || betAmount > maxBet) {
    //   const errorResponse = {
    //     uniqueCode: "CGP00G10",
    //     message: `Bet amount must be between ${minBet} and ${maxBet}.`,
    //     data: {
    //       status: "error",
    //       success: false,
    //     },
    //   };
    //   logToFolderError("Client/controller", "validateBetAmount", errorResponse);
    //   return errorResponse;
    // }

    // If valid, return success
    const successResponse = {
      uniqueCode: "CGP00G11",
      // message: "Bet amount is within the valid range.",
      message: "Currently it is not configured.",
      data: {
        status: "success",
        success: true,
      },
    };
    logToFolderInfo("Client/controller", "validateBetAmount", successResponse);
    return successResponse;
  } catch (error) {
    const errorResponse = {
      uniqueCode: "CGP00G12",
      message: error.message,
      data: {
        status: "error",
        success: false,
      },
    };
    logToFolderError("Client/controller", "validateBetAmount", errorResponse);
    return errorResponse;
  }
};
