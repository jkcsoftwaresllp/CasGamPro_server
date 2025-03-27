import { db } from "../../config/db.js";
import { games } from "../../database/modals/games.js";
import { eq } from "drizzle-orm";
import { getUserById } from "../../database/queries/users/sqlGetUsers.js";
import { createResponse } from "../../helper/responseHelper.js";
import { ROLES } from "../../database/modals/doNotChangeOrder.helper.js";

export const checkPlayerCanPlay = async (req, res) => {
  const { gameId } = req.params;
  const userId = req.session.userId;

  try {
    // Ensure user is logged in
    if (!userId) {
      return res
        .status(401)
        .json(
          createResponse(
            "error",
            "CGP0090",
            "Unauthorized",
            "User not logged in"
          )
        );
    }

    // Get user details
    const user = await getUserById(userId);
    if (!user) {
      return res
        .status(404)
        .json(
          createResponse(
            "error",
            "CGP0091",
            "User not found",
            "Invalid user ID"
          )
        );
    }

    const { parent_id } = user;

    // Get game blocking info
    const result = await db
      .select({ blocked: games.blocked, blockedBy: games.blocked_by })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!result.length) {
      return res.json(
        createResponse("success", "CGP0092", "Game is not blocked", {
          canPlay: true,
        })
      );
    }

    const { blocked, blockedBy } = result[0];

    // Admin-level block (GLOBAL BLOCK)
    if (blocked === "BLOCKED") {
      return res.json(
        createResponse("success", "CGP0093", "Game is blocked globally", {
          canPlay: false,
        })
      );
    }

    // Check if blockedBy exists in the user's parent hierarchy
    let currentParent = parent_id;
    while (currentParent) {
      const parentUser = await getUserById(currentParent);
      if (!parentUser) break;
      if (parentUser.id === blockedBy) {
        return res.json(
          createResponse("success", "CGP0094", "Game is blocked by parent", {
            canPlay: false,
          })
        );
      }
      currentParent = parentUser.parent_id;
    }

    return res.json(
      createResponse("success", "CGP0095", "Game is available to play", {
        canPlay: true,
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(
        createResponse(
          "error",
          "CGP0096",
          "Internal server error",
          error.message
        )
      );
  }
};
