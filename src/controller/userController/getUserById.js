import { db } from "../../config/db.js";
import { users, players } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const getUserById = async (reqOrUserId, res = null) => {
  try {
    let userId;

    // Check if first argument is a request object or just an ID
    if (typeof reqOrUserId === "object" && reqOrUserId.params) {
      userId = parseInt(reqOrUserId.params.id);
    } else {
      userId = parseInt(reqOrUserId);
    }

    if (isNaN(userId)) {
      let temp = {
        uniqueCode: "CGP0111",
        message: "Invalid user ID",
        data: { userId: reqOrUserId.params ? reqOrUserId.params.id : userId },
      };
      logToFolderError("User/controller", "getUserById", temp);

      if (res) return res.status(400).json(temp);
      return null; // Return `null` when used internally
    }

    // Fetch user details
    const user = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        // password: users.password, // Including password
        blockingLevels: users.blocking_levels,
        createdAt: users.created_at,
        fixLimit: players.balance, // Player-related fields TODO: Fix Limit & balance are one & the Same thing
        share: players.share,
        lotteryCommission: players.lotteryCommission,
        casinoCommission: players.casinoCommission,
      })
      .from(users)
      .leftJoin(players, eq(users.id, players.userId))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      let temp = {
        uniqueCode: "CGP0112",
        message: "User not found",
        data: { userId },
      };
      logToFolderError("User/controller", "getUserById", temp);

      if (res) return res.status(404).json(temp);
      return null; // Return `null` when used internally
    }

    let temp = {
      uniqueCode: "CGP0113",
      message: "User fetched successfully",
      data: user[0],
    };

    logToFolderInfo("User/controller", "getUserById", response);

    if (res) return res.status(200).json(response);
    return user[0]; // Return user data when used internally
  } catch (error) {
    let temp = {
      uniqueCode: "CGP0114",
      message: "Internal Server Error",
      data: { error: error.message },
    };
    logToFolderError("User/controller", "getUserById", temp);

    if (res) return res.status(500).json(temp);
    return null; // Return `null` when used internally
  }
};
