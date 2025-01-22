import { db } from "../../config/db.js";
import { eq } from "drizzle-orm";
import { notifications } from "../../database/schema.js"; // Import the notifications schema

export const getNotification = async (req, res) => {
  const userId = req.session.userId; // Assuming the user is authenticated and `req.user.id` is available

  try {
    // Query the notifications table for the specific user
    const userNotifications = await db
      .select(notifications.message) // Select only the 'message' field
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt.desc()); // Optional: Order by created date, descending

    if (userNotifications.length === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0018",
        message: "No notifications found",
        data: {},
      });
    }

    // Extract only the messages and return as an array
    const notificationMessages = userNotifications.map(
      (notification) => notification.message
    );

    res.status(200).json({
      uniqueCode: "CGP0019",
      message: "",
      data: { notifications: notificationMessages },
    });
  } catch (error) {
    res.status(500).json({
      uniqueCode: "CGP0020",
      message: "Error fetching notifications",
      data: {
        error: error.message,
      },
    });
  }
};
