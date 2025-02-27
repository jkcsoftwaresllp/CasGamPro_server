import { eq } from "drizzle-orm";
import {
  logToFolderError,
  logToFolderInfo,
} from "../../../utils/logToFolder.js";
import { users } from "../../../database/schema.js";
import { db } from "../../../config/db.js";
// Method to check if the bet can be placed
export const checkBetBlocking = async (playerId) => {
  // Get the user's current blocking level
  const user = await db.select().from(users).where(eq(users.id, playerId));

  if (user.length === 0) {
    let errorLog = {
      uniqueCode: "CGP0131",
      message: "User not found",
      data: {},
    };
    logToFolderError("Agent/controller", "checkBetBlocking", errorLog);
    throw { status: 404, message: errorLog };
  }

  const blockingLevel = user[0].blocking_levels;

  // Restrict only LEVEL_2 users from placing bets
  if (blockingLevel === "LEVEL_2") {
    let errorLog = {
      uniqueCode: "CGP0133",
      message: "Bet placing is not allowed for users with LEVEL_2 blocking",
      data: { playerId, blockingLevel },
    };
    logToFolderError("Agent/controller", "checkBetBlocking", errorLog);
    throw { status: 403, message: errorLog };
  }

  return true;
};
