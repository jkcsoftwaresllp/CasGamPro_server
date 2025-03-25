import { db } from "../../config/db.js";
import { users } from "../../database/schema.js";
import { eq, and } from "drizzle-orm";

export async function getUserExposure(req, res) {
  try {
    const { userId } = req.params;
    const ownerId = req.session.userId;

    if (!ownerId) {
      return res.status(401).json({
        uniqueCode: "CGP0151",
        message: "Unauthorized access. Please log in.",
        data: {},
      });
    }

    const user = await db
      .select({ id: users.id, coins: users.coins, exposure: users.exposure })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.parent_id, ownerId)))
      .limit(1);

    if (user.length === 0) {
      return res.status(403).json({
        uniqueCode: "CGP0152",
        message: "Access denied. User does not belong to your hierarchy.",
        data: {},
      });
    }

    return res.status(200).json({
      uniqueCode: "CGP0153",
      message: "User exposure fetched successfully",
      data: {
        userId,
        exposure: user[0].exposure,
        coins: user[0].coins,
      },
    });
  } catch (error) {
    console.error("Error fetching user exposure:", error);
    return res.status(500).json({
      uniqueCode: "CGP0154",
      message: "Internal server error",
      data: {},
    });
  }
}
