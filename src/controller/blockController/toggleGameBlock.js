import { db } from "../../config/db.js";
import { games } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const toggleGameBlock = async (req, res) => {
  try {
    const { gameId } = req.body;

    // Validate input
    if (!gameId) {
      let errorLog = {
        uniqueCode: "CGP0140",
        message: "Game ID is required",
        data: {},
      };
      logToFolderError("Agent/controller", "toggleGameBlock", errorLog);
      return res.status(400).json(errorLog);
    }

    // Fetch current game status
    const game = await db.select().from(games).where(eq(games.id, gameId));

    if (game.length === 0) {
      let errorLog = {
        uniqueCode: "CGP0141",
        message: "Game not found",
        data: { gameId },
      };
      logToFolderError("Agent/controller", "toggleGameBlock", errorLog);
      return res.status(404).json(errorLog);
    }

    const currentBlockStatus = game[0].blocked;
    const newBlockStatus = currentBlockStatus ? false : true;

    // Update the block status
    await db
      .update(games)
      .set({ blocked: newBlockStatus })
      .where(eq(games.id, gameId));

    let successLog = {
      uniqueCode: "CGP0142",
      message: `Game ${gameId} block status updated successfully`,
      data: { gameId, newBlockStatus },
    };
    logToFolderInfo("Agent/controller", "toggleGameBlock", successLog);

    return res.status(200).json(successLog);
  } catch (error) {
    let errorLog = {
      uniqueCode: "CGP0143",
      message: "Internal server error",
      data: { error: error.message },
    };
    logToFolderError("Agent/controller", "toggleGameBlock", errorLog);
    return res.status(500).json(errorLog);
  }
};
