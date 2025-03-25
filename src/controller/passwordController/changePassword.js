import { db } from "../../config/db.js";
import { users } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";
import { logger } from "../../logger/logger.js";
import { createResponse } from "../../helper/responseHelper.js";

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;


    const userId = req.session.userId;

    if (!userId) {
      return res
        .status(401)
        .json(createResponse("error", "CGP0071", "User not authenticated"));
    }

    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res
        .status(404)
        .json(createResponse("error", "CGP0072", "User not found"));
    }

    // Verify current password
    if (currentPassword !== user.password) {
      return res
        .status(400)
        .json(createResponse("error", "CGP0073", "Incorrect current password"));
    }

    // Update password
    await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId));

    return res
      .status(200)
      .json(
        createResponse("success", "CGP0074", "Password changed successfully")
      );
  } catch (error) {
    logger.error("Error changing password:", error);
    return res.status(500).json(
      createResponse("error", "CGP0075", "Internal server error", {
        error: error.message,
      })
    );
  }
};

export const changeUserPassword = async (req, res) => {
  try {
    const {
      id: userId,
      newPassword,
      currentPassword,
      confirmPassword,
    } = req.body;
    const ownerId = req.session.userId;

    if (newPassword !== confirmPassword) {
      return res
        .status(404)
        .json(
          createResponse(
            "error",
            "CGP0076",
            "New Password & Confirm Password must be same."
          )
        );
    }

    // Verify admin and user relationship
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.parent_id, ownerId)));

    if (!user) {
      return res
        .status(404)
        .json(
          createResponse(
            "error",
            "CGP0076",
            "User not found or not under your control"
          )
        );
    }

    // Verify admin and user relationship
    const [owner] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, ownerId), eq(users.password, currentPassword)));


    if (!owner) {
      return res
        .status(404)
        .json(
          createResponse(
            "error",
            "CGP0076",
            "You are not Authorised to change the password."
          )
        );
    }

    // Update password
    await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId));

    return res
      .status(200)
      .json(
        createResponse(
          "success",
          "CGP0077",
          "User password updated successfully"
        )
      );
  } catch (error) {
    logger.error("Error changing user password:", error);
    return res.status(500).json(
      createResponse("error", "CGP0078", "Internal server error", {
        error: error.message,
      })
    );
  }
};
