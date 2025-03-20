import { db } from "../../config/db.js";
import { users, BLOCKING_LEVELS } from "../../database/schema.js";
import { eq } from "drizzle-orm";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const setBlocking = async (req, res) => {
  try {
    const { userId, blockingLevel } = req.body;
    const requesterId = req.session.userId;

    if (!requesterId || !userId || !blockingLevel) {
      let errorLog = {
        uniqueCode: "CGP0117",
        message: "User ID, and blocking level are required",
        data: {},
      };
      logToFolderError("User/controller", "setBlocking", errorLog);
      return res.status(400).json(errorLog);
    }

    if (!BLOCKING_LEVELS.includes(blockingLevel)) {
      let errorLog = {
        uniqueCode: "CGP0118",
        message: "Invalid blocking level",
        data: { blockingLevel },
      };
      logToFolderError("User/controller", "setBlocking", errorLog);
      return res.status(400).json(errorLog);
    }

    const requester = await db.select().from(users).where(eq(users.id, requesterId));
    const targetUser = await db.select().from(users).where(eq(users.id, userId));

    if (!requester.length || !targetUser.length) {
      let errorLog = {
        uniqueCode: "CGP0122",
        message: "Requester or target user not found",
        data: {},
      };
      logToFolderError("User/controller", "setBlocking", errorLog);
      return res.status(404).json(errorLog);
    }

    // Update blocking level for the target user and cascade it to all subordinates
    await db.transaction(async (tx) => {
      await tx.update(users).set({ blocking_levels: blockingLevel }).where(eq(users.id, userId));
      
      // Block all subordinates recursively
      const blockSubordinates = async (parentId) => {
        const subordinates = await tx.select().from(users).where(eq(users.parent_id, parentId));
        for (const subordinate of subordinates) {
          await tx.update(users).set({ blocking_levels: blockingLevel }).where(eq(users.id, subordinate.id));
          await blockSubordinates(subordinate.id); // Recursive blocking
        }
      };

      await blockSubordinates(userId);
    });

    let successLog = {
      uniqueCode: "CGP0120",
      message: `User blocking status updated to ${blockingLevel}`,
      data: { userId, blockingLevel },
    };
    logToFolderInfo("User/controller", "setBlocking", successLog);

    return res.status(200).json(successLog);
  } catch (error) {
    let errorLog = {
      uniqueCode: "CGP0121",
      message: "Internal server error",
      data: { error: error.message },
    };
    logToFolderError("User/controller", "setBlocking", errorLog);
    return res.status(500).json(errorLog);
  }
};
