import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { users } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";

export const updateUserDetails = async (req, res) => {
    const userId = req.params.id; // The user being updated
    const requesterId = req.session.userId; // The user making the request
  
    if (!userId || !requesterId) {
      let errorResponse = {
        uniqueCode: "CGP0040",
        message: "User ID and Requester ID are required",
        data: {},
      };
      logToFolderError("Agent/controller", "updateUserDetails", errorResponse);
      return res.status(400).json(errorResponse);
    }
  
    const { firstName, lastName, blockingLevels } = req.body;
  
    try {
      // Fetch the requester and target user from the users table
      const [requesterData, targetUserData] = await Promise.all([
        db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, requesterId)),
        db.select({ id: users.id, role: users.role, parent_id: users.parent_id }).from(users).where(eq(users.id, userId)),
      ]);
  
      const requester = requesterData[0]; // Fix: Access the first element
      const targetUser = targetUserData[0]; // Fix: Access the first element
  
      if (!requester) {
        let errorResponse = {
          uniqueCode: "CGP0041",
          message: "Requester not found",
          data: {},
        };
        logToFolderError("Agent/controller", "updateUserDetails", errorResponse);
        return res.status(404).json(errorResponse);
      }
  
      if (!targetUser) {
        let errorResponse = {
          uniqueCode: "CGP0209",
          message: "User not found",
          data: {},
        };
        logToFolderError("Agent/controller", "updateUserDetails", errorResponse);
        return res.status(404).json(errorResponse);
      }
  
      // Authorization Check: Ensure the requester is the direct parent of the target user
      if (targetUser.parent_id !== requester.id) {
        let errorResponse = {
          uniqueCode: "CGP0300",
          message: "Permission denied. You can update only your direct subordinates.",
          data: {},
        };
        logToFolderError("User/controller", "updateUserDetails", errorResponse);
        return res.status(403).json(errorResponse);
      }
  
      // Update the users table
      await db
        .update(users)
        .set({
          first_name: firstName ?? targetUser.first_name,
          last_name: lastName ?? targetUser.last_name,
          blocking_levels: blockingLevels ?? targetUser.blocking_levels,
        })
        .where(eq(users.id, userId));
  
      let successResponse = {
        uniqueCode: "CGP0043",
        message: "User details updated successfully",
        data: {},
      };
      logToFolderInfo("Agent/controller", "updateUserDetails", successResponse);
  
      return res.status(200).json(successResponse);
    } catch (error) {
      let errorResponse = {
        uniqueCode: "CGP0044",
        message: "Error updating user details",
        data: { error: error.message },
      };
      logToFolderError("Agent/controller", "updateUserDetails", errorResponse);
      return res.status(500).json(errorResponse);
    }
  };
  