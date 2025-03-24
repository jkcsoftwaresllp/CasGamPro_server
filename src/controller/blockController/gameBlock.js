import { db } from "../../config/db.js";
import { games } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { createResponse } from "../../helper/responseHelper.js";
import SocketManager from "../../services/shared/config/socket-manager.js";

export const gameBlock = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json(
        createResponse("error", "CGP0051", "Game ID is required")
      );
    }

    // Get current status first
    const [game] = await db
      .select({ blocked: games.blocked })
      .from(games)
      .where(eq(games.id, id));

    if (!game) {
      return res.status(404).json(
        createResponse("error", "CGP0052", "Game not found")
      );
    }

    const currentStatus = game.blocked;

    // Toggle game status
    await db
      .update(games)
      .set({ blocked: !currentStatus })
      .where(eq(games.id, id));

    // Emit socket event to notify clients
    SocketManager.io?.emit("gameStatusUpdate", {
      id,
      blocked: !currentStatus,
    });

    return res.status(200).json(
      createResponse("success", "CGP0053", `Game ${currentStatus ? "unblocked" : "blocked"} successfully`, {
        id,
        blocked: !currentStatus,
      })
    );

  } catch (error) {
    logger.error("Error toggling game block:", error);
    return res.status(500).json(
      createResponse("error", "CGP0055", "Internal server error", { error: error.message })
    );
  }
};

export const getBlockedGames = async (req, res) => {
  try {
    const results = await db
      .select({
        id: games.id,
        name: games.name,
        blocked: games.blocked,
        gameType: games.gameType,
      })
      .from(games);

    return res.status(200).json(
      createResponse("success", "CGP0056", "Games fetched successfully", { results })
    );
  } catch (error) {
    logger.error("Error fetching blocked games:", error);
    return res.status(500).json(
      createResponse("error", "CGP0057", "Internal server error", { error: error.message })
    );
  }
};