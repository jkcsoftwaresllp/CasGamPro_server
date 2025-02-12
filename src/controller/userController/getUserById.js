import { db } from "../../config/db.js";
import { users, players } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const getUserById = async (req, res) => {
  try {
    // Extract user ID from request params
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      let temp = {
        uniqueCode: "USR001",
        message: "Invalid user ID",
        data: { userId: req.params.id },
      };
      logToFolderError("User/controller", "getUserById", temp);
      return res.status(400).json(temp);
    }

    // Fetch user details with player-specific data if available
    const user = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        password: users.password, // Including password
        blockingLevels: users.blocking_levels,
        createdAt: users.created_at,
        fixLimit: players.fixLimit, // Player-related fields
        matchShare: players.matchShare,
        lotteryCommission: players.lotteryCommission,
        sessionCommission: players.sessionCommission,
      })
      .from(users)
      .leftJoin(players, eq(users.id, players.userId))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      let temp = {
        uniqueCode: "USR002",
        message: "User not found",
        data: { userId },
      };
      logToFolderError("User/controller", "getUserById", temp);
      return res.status(404).json(temp);
    }

    let temp = {
      uniqueCode: "USR003",
      message: "User fetched successfully",
      data: user[0],
    };
    logToFolderInfo("User/controller", "getUserById", temp);

    res.status(200).json(temp);
  } catch (error) {
    let temp = {
      uniqueCode: "USR004",
      message: "Internal Server Error",
      data: { error: error.message },
    };
    logToFolderError("User/controller", "getUserById", temp);

    res.status(500).json(temp);
  }
};
