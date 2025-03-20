import { db } from "../../config/db.js";
import { games } from "../../database/modals/games.js";
import { users } from "../../database/modals/user.js";
import { eq, inArray } from "drizzle-orm";
import {
  getUserRoleById,
  getHierarchyUnderUser,
} from "../../database/queries/users/sqlGetUsers.js";
import { GAMEBLOCK } from "../../database/modals/doNotChangeOrder.helper.js";
import { createResponse } from "../../helper/responseHelper.js";

export const blockGames = async (req, res) => {
  try {
    const { gameId } = req.body;
    const userId = req.session?.userId;

    // Validate input
    if (!gameId || !userId) {
      return res
        .status(400)
        .json(
          createResponse(
            "error",
            "CGP0080",
            "User ID and blocking level are required"
          )
        );
    }

    // Fetch user's role
    const userRole = await getUserRoleById(userId);
    if (!userRole) {
      return res
        .status(403)
        .json(createResponse("error", "CGP0081", "Unauthorized access"));
    }

    // Determine new block level based on role
    const roleBlockLevels = {
      ADMIN: GAMEBLOCK[1], // LEVEL_1
      SUPERAGENT: GAMEBLOCK[2], // LEVEL_2
      AGENT: GAMEBLOCK[3], // LEVEL_3
    };

    if (!roleBlockLevels[userRole]) {
      return res
        .status(403)
        .json(createResponse("error", "CGP0082", "Invalid role for blocking"));
    }

    const newBlockLevel = roleBlockLevels[userRole];

    // Fetch current block level from DB
    const [existingGame] = await db
      .select({ blocked: games.blocked, blocked_by: games.blocked_by })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!existingGame) {
      return res
        .status(404)
        .json(createResponse("error", "CGP0083", "Game not found"));
    }

    const currentBlockLevel = existingGame.blocked || "NONE";
    let blockedByUsers = existingGame.blocked_by
      ? JSON.parse(existingGame.blocked_by)
      : [];

    // Prevent lowering block levels
    const blockHierarchy = { NONE: 0, LEVEL_3: 1, LEVEL_2: 2, LEVEL_1: 3 };
    if (blockHierarchy[newBlockLevel] < blockHierarchy[currentBlockLevel]) {
      return res
        .status(400)
        .json(
          createResponse(
            "error",
            "CGP0084",
            `Cannot downgrade block level from ${currentBlockLevel} to ${newBlockLevel}`
          )
        );
    }

    // Add user to blocked_by list
    if (!blockedByUsers.includes(userId)) {
      blockedByUsers.push(userId);
    }

    // Fetch affected users based on hierarchy
    const affectedUsers = await getHierarchyUnderUser(userId, userRole);

    // Update game block status
    await db
      .update(games)
      .set({
        blocked: newBlockLevel,
        blocked_by: JSON.stringify(blockedByUsers),
      })
      .where(eq(games.id, gameId));

    return res.status(200).json(
      createResponse(
        "success",
        "CGP0085",
        `Game ${gameId} blocked at level ${newBlockLevel} by ${userRole} (${userId})`,
        {
          affectedUsers,
        }
      )
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        createResponse(
          "error",
          "CGP0086",
          "Internal server error",
          error.message
        )
      );
  }
};
