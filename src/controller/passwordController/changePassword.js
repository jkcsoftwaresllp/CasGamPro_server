import bcrypt from "bcryptjs";
import { db } from "../../config/db.js";
import { users } from "../../database/schema.js";
import { logger } from "../../logger/logger.js";

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        uniqueCode: "CGP0026",
        message: "User not authenticated",
        data: { success: false },
      });
    }

    // Fetch the user using Drizzle ORM
    const user = await db.select().from(users).where({ id: userId }).limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0027",
        message: "User not found",
        data: { success: false },
      });
    }

    // Compare the current password with the stored hash using bcrypt
    const isMatch = await bcrypt.compare(currentPassword, user[0].password);

    if (!isMatch) {
      return res.status(400).json({
        uniqueCode: "CGP0028",
        message: "Incorrect current password",
        data: { success: false },
      });
    }

    // Check if the new password is the same as the current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        uniqueCode: "CGP0031",
        message: "New password cannot be the same as the current password",
        data: { success: false },
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database using Drizzle ORM
    await db
      .update(users)
      .set({ password: hashedNewPassword })
      .where({ id: userId });

    return res.json({
      uniqueCode: "CGP0029",
      message: "Password changed successfully",
      data: { success: true },
    });
  } catch (error) {
    logger.error("Error changing password:", error.stack || error);
    return res.status(500).json({
      uniqueCode: "CGP0030",
      message: "Internal server error",
      data: { success: false },
    });
  }
};
