import { db } from "../../config/db.js";
import { eq } from "drizzle-orm";
import { notifications } from "../../database/schema.js"; 

export const getNotification = async (req, res) => {
  const userId = req.session.userId; 

  try {
    // Query the notifications table for the specific user
    const userNotifications = await db
      .select(notifications.message) 
      .from(notifications)
      .where(eq(notifications.user_id, userId))
      .orderBy(notifications.created_at.desc()); 

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
