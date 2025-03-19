import { db } from "../../config/db.js";
import { notifications } from "../../database/schema.js"; 

export const addNotification = async (req, res) => {
  const { user_id, message } = req.body;

  if (!user_id || !message) {
    return res.status(400).json({
      uniqueCode: "CGP0015",
      message: "User ID and notification message are required",
      data: {},
    });
  }

  try {
    // Insert new notification into the notifications table
    const newNotification = await db.insert(notifications).values({
      user_id,
      message,
    });

    res.status(201).json({
      uniqueCode: "CGP0016",
      message: "Notification added successfully",
      data: { notification: newNotification },
    });
  } catch (error) {
    res.status(500).json({
      uniqueCode: "CGP0017",
      message: "Error adding notification",
      data: {
        error: error.message,
      },
    });
  }
};
