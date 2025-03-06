import { db } from "../../config/db.js";
import { users } from "../../database/schema.js";
import { logToFolderError, logToFolderInfo } from "../../utils/logToFolder.js";
import { eq } from "drizzle-orm";

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, id = null } = req.body;
  let userId;

  if (id === null) userId = req.session.userId;
  else userId = id;

  try {
    if (!userId) {
      const unauthenticatedResponse = {
        uniqueCode: "CGP0026",
        message: "User not authenticated",
        data: { success: false },
      };
      logToFolderError(
        "Client/controller",
        "changePassword",
        unauthenticatedResponse
      );
      return res.status(401).json(unauthenticatedResponse);
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      const userNotFoundResponse = {
        uniqueCode: "CGP0027",
        message: "User not found",
        data: { success: false },
      };
      logToFolderError(
        "Client/controller",
        "changePassword",
        userNotFoundResponse
      );
      return res.status(404).json(userNotFoundResponse);
    }

    //Directly Compare Plain Text Passwords
    if (currentPassword !== user[0].password) {
      const incorrectPasswordResponse = {
        uniqueCode: "CGP0028",
        message: "Incorrect current password",
        data: { success: false },
      };
      logToFolderError(
        "Client/controller",
        "changePassword",
        incorrectPasswordResponse
      );
      return res.status(400).json(incorrectPasswordResponse);
    }

    // Prevent reusing the same password
    if (newPassword === user[0].password) {
      const samePasswordResponse = {
        uniqueCode: "CGP0031",
        message: "New password cannot be the same as the current password",
        data: { success: false },
      };
      logToFolderError(
        "Client/controller",
        "changePassword",
        samePasswordResponse
      );
      return res.status(400).json(samePasswordResponse);
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

    const successResponse = {
      uniqueCode: "CGP0029",
      message: "Password changed successfully",
      data: { success: true },
    };
    logToFolderInfo("Client/controller", "changePassword", successResponse);
    return res.json(successResponse);
  } catch (error) {
    const errorResponse = {
      uniqueCode: "CGP0030",
      message: "Internal server error",
      data: { success: false, error: error.message },
    };
    logToFolderError("Client/controller", "changePassword", errorResponse);
    return res.status(500).json(errorResponse);
  }
};
