import { db } from "../config/db.js";
import { notifications } from "../database/schema.js"; // Import the notifications schema

export const notificationController = {
  // Add a new notification for a user
  addNotification: async (req, res) => {
    const { userId, message } = req.body; // Assume the notification data comes from the request body

    if (!userId || !message) {
      return res.status(400).json({
        uniqueCode: "CGP0005",
        message: "User ID and notification message are required",
        data: {},
      });
    }

    try {
      // Insert new notification into the notifications table
      const newNotification = await db.insert(notifications).values({
        userId,
        message,
      });

      res.status(201).json({
        uniqueCode: "CGP0006",
        message: "Notification added successfully",
        data: { notification: newNotification },
      });
    } catch (error) {
      res.status(500).json({
        uniqueCode: "CGP0007",
        message: "Error adding notification",
        data: {
          error: error.message,
        },
      });
    }
  },

  // To get all notifications for a user
  getNotification: async (req, res) => {
    const userId = req.user.id; // Assuming the user is authenticated and `req.user.id` is available

    try {
      // Query the notifications table for the specific user
      const userNotifications = await db
        .select(notifications.message) // Select only the 'message' field
        .from(notifications)
        .where(notifications.userId.eq(userId))
        .orderBy(notifications.createdAt.desc()); // Optional: Order by created date, descending

      if (userNotifications.length === 0) {
        return res.status(404).json({
          uniqueCode: "CGP0008",
          message: "No notifications found",
          data: {},
        });
      }

      // Extract only the messages and return as an array
      const notificationMessages = userNotifications.map(
        (notification) => notification.message
      );

      res.status(200).json({
        uniqueCode: "CGP0009",
        message: "",
        data: { notifications: notificationMessages },
      });
    } catch (error) {
      res.status(500).json({
        uniqueCode: "CGP0010",
        message: "Error fetching notifications",
        data: {
          error: error.message,
        },
      });
    }
  },
};
