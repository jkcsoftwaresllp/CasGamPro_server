import { db } from "../../config/db.js";
import { users } from "../../database/schema.js";
import { logger } from "../../logger/logger.js";
import { eq } from "drizzle-orm";

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.userId;

  try {
    if (!userId) {
      return res.status(401).json({
        uniqueCode: "CGP0026",
        message: "User not authenticated",
        data: { success: false },
      });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0027",
        message: "User not found",
        data: { success: false },
      });
    }

    //Directly Compare Plain Text Passwords
    if (currentPassword !== user[0].password) {
      return res.status(400).json({
        uniqueCode: "CGP0028",
        message: "Incorrect current password",
        data: { success: false },
      });
    }

    // Prevent reusing the same password
    if (newPassword === user[0].password) {
      return res.status(400).json({
        uniqueCode: "CGP0031",
        message: "New password cannot be the same as the current password",
        data: { success: false },
      });
    }

    // // Validate password strength
    // const passwordRegex =
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    // if (!passwordRegex.test(newPassword)) {
    //   return res.status(400).json({
    //     uniqueCode: "CGP0032",
    //     message:
    //       "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters",
    //     data: { success: false },
    //   });
    // }

    // Store Plain Text Password
    await db
      .update(users)
      .set({ password: newPassword }) // Storing password as plain text
      .where(eq(users.id, userId));

    return res.json({
      uniqueCode: "CGP0029",
      message: "Password changed successfully",
      data: { success: true },
    });
  } catch (error) {
    logger.error(
      `Error changing password for user ${userId}:`,
      error.stack || error
    );
    return res.status(500).json({
      uniqueCode: "CGP0030",
      message: "Internal server error",
      data: { success: false },
    });
  }
};
