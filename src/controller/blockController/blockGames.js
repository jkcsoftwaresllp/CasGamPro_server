import { db } from "../../config/db.js";
import { games } from "../../database/modals/games.js";
import { users } from "../../database/modals/user.js";
import { eq, sql, inArray } from "drizzle-orm";
import {
  getUserRoleById,
  getHierarchyUnderUser,
} from "../../database/queries/users/sqlGetUsers.js";
import { GAMEBLOCK } from "../../database/modals/doNotChangeOrder.helper.js";
export const blockGames = async (req, res) => {
  try {
    const { gameId } = req.body;
    const userId = req.session.userId;

    if (!gameId) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid gameId" });
    }

    // Fetch user's role
    const userRole = await getUserRoleById(userId);
    if (!userRole) {
      return res
        .status(403)
        .json({ status: "error", message: "Unauthorized access" });
    }

    // Determine the new blocking level
    let newBlockLevel;
    switch (userRole) {
      case "ADMIN":
        newBlockLevel = GAMEBLOCK[1]; // "LEVEL_1"
        break;
      case "SUPERAGENT":
        newBlockLevel = GAMEBLOCK[2]; // "LEVEL_2"
        break;
      case "AGENT":
        newBlockLevel = GAMEBLOCK[3]; // "LEVEL_3"
        break;
      case "PLAYER":
        return res
          .status(403)
          .json({ status: "error", message: "Players cannot block games" });
      default:
        return res
          .status(403)
          .json({ status: "error", message: "Unknown role" });
    }

    // Fetch current block level from DB
    const existingGame = await db
      .select({
        blocked: games.blocked,
        blocked_by: games.blocked_by,
      })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!existingGame.length) {
      return res
        .status(404)
        .json({ status: "error", message: "Game not found" });
    }

    const currentBlockLevel = existingGame[0].blocked;
    let blockedByUsers = existingGame[0].blocked_by
      ? JSON.parse(existingGame[0].blocked_by)
      : [];

    // Prevent lowering block levels (e.g., LEVEL_3 → LEVEL_2)
    const blockHierarchy = {
      NONE: 0,
      LEVEL_3: 1,
      LEVEL_2: 2,
      LEVEL_1: 3,
    };

    if (blockHierarchy[newBlockLevel] < blockHierarchy[currentBlockLevel]) {
      return res.status(400).json({
        status: "error",
        message: `Cannot downgrade block level from ${currentBlockLevel} to ${newBlockLevel}`,
      });
    }

    // Add userId to `blocked_by` if not already present
    if (!blockedByUsers.includes(userId)) {
      blockedByUsers.push(userId);
    }

    // Fetch affected users based on hierarchy
    const affectedUsers = await getHierarchyUnderUser(userId,userRole);

    // Update game block status
    await db
      .update(games)
      .set({
        blocked: newBlockLevel,
        blocked_by: JSON.stringify(blockedByUsers),
      })
      .where(eq(games.id, gameId));

    return res.status(200).json({
      status: "success",
      message: `Game ${gameId} blocked at level ${newBlockLevel} by ${userRole} (${userId})`,
      affectedUsers,
    });
  } catch (error) {
    console.error("Error in blockGameByRole:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};
