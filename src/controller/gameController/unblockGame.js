import { db } from "../../config/db.js";
import { games } from "../../database/modals/games.js";
import { eq, and } from "drizzle-orm";
import { getUserRoleById } from "../../database/queries/users/sqlGetUsers.js";
import { createResponse } from "../../helper/responseHelper.js";
import {
  ROLES,
  GAMEBLOCK,
} from "../../database/modals/doNotChangeOrder.helper.js";

export const unblockGame = async (req, res) => {
  try {
    const { gameId } = req.body;
    const userId = req.session.userId;

    // Validate input
    if (!gameId || !userId) {
      return res
        .status(400)
        .json(
          createResponse("error", "CGP0097", "User ID and game ID are required")
        );
    }

    // Fetch user's role
    const userRole = await getUserRoleById(userId);
    if (!userRole) {
      return res
        .status(403)
        .json(createResponse("error", "CGP0098", "Unauthorized access"));
    }

    // Fetch the current game blocking details
    const game = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .then((result) => result[0]);

    if (!game || game.blocked === GAMEBLOCK[0]) {
      return res
        .status(404)
        .json(createResponse("error", "CGP0099", "Game is not blocked"));
    }

    // Determine if user has permission to unblock
    const roleIndex = ROLES.indexOf(userRole.toUpperCase());
    const blockedByIndex = ROLES.indexOf(
      await getUserRoleById(game.blocked_by)
    );

    const canUnblock =
      userRole === "ADMIN" || // Admin can unblock any game
      roleIndex < blockedByIndex || // Higher-level roles can unblock
      userId === game.blocked_by; // The blocker can unblock their own

    if (!canUnblock) {
      return res
        .status(403)
        .json(
          createResponse(
            "error",
            "CGP0099",
            "Unauthorized to unblock this game"
          )
        );
    }

    // Update game to unblock
    await db
      .update(games)
      .set({ blocked: GAMEBLOCK[0], blocked_by: null }) // Reset block
      .where(eq(games.id, gameId));

    return res
      .status(200)
      .json(
        createResponse(
          "success",
          "CGP0100",
          `Game ${gameId} has been unblocked`
        )
      );
  } catch (error) {
    console.error("Error in unblockGame:", error);
    return res
      .status(500)
      .json(
        createResponse(
          "error",
          "CGP0101",
          "Internal server error",
          error.message
        )
      );
  }
};
