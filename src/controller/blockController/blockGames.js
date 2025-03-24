import { db } from "../../config/db.js";
import { games } from "../../database/modals/games.js";
import { eq } from "drizzle-orm";
import { getUserRoleById } from "../../database/queries/users/sqlGetUsers.js";
import { createResponse } from "../../helper/responseHelper.js";
import { ROLES } from "../../database/modals/doNotChangeOrder.helper.js";

export const blockGames = async (req, res) => {
  try {
    const { gameId } = req.body;
    const userId = req.session.userId;

    // Validate input
    if (!gameId || !userId) {
      return res
        .status(400)
        .json(
          createResponse("error", "CGP0080", "User ID and game ID are required")
        );
    }

    // Fetch user's role
    const userRole = await getUserRoleById(userId);

    if (!userRole) {
      return res
        .status(403)
        .json(createResponse("error", "CGP0081", "Unauthorized access"));
    }

    // Determine block level based on role
    let blockLevel;
    if (ROLES.includes(userRole.toUpperCase().trim())) {
      if (userRole === "ADMIN") blockLevel = "BLOCKED";
      else if (userRole === "SUPERAGENT") blockLevel = "RESTRICTED";
      else if (userRole === "AGENT") blockLevel = "LIMITED";
    } else {
      return res
        .status(403)
        .json(createResponse("error", "CGP0084", "Unauthorized action"));
    }

    // Update game blocking
    await db
      .update(games)
      .set({ blocked: blockLevel, blocked_by: userId })
      .where(eq(games.id, gameId));

    return res
      .status(200)
      .json(
        createResponse(
          "success",
          "CGP0082",
          `Game ${gameId} blocked at level ${blockLevel}`
        )
      );
  } catch (error) {
    console.error("Error in blockGames:", error);
    return res
      .status(500)
      .json(
        createResponse(
          "error",
          "CGP0083",
          "Internal server error",
          error.message
        )
      );
  }
};
