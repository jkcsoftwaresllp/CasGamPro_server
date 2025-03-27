import { db } from "../../config/db.js";
import { eq } from "drizzle-orm";
import { users } from "../../database/schema.js";

// Fetch collection report and categorize transactions
export async function getCollectionReport(req, res) {
  try {
    const ownerId = req.session.userId;

    // Validate session user
    if (!ownerId) {
      return res.status(401).json({
        uniqueCode: "CGP0072",
        message: "Unauthorized access. Please log in.",
        data: {},
      });
    }

    // Fetch transactions
    const transactions = await db
      .select({
        childId: users.id,
        firstName: users.first_name,
        lastName: users.last_name,
        exposure: users.exposure,
      })
      .from(users)
      .where(eq(users.parent_id, ownerId));

    // Categorize transactions
    const paymentReceivingFrom = [];
    const paymentPaidTo = [];
    const paymentCleared = [];

    transactions.forEach(({ childId, firstName, lastName, exposure }) => {
      const amount = parseFloat(exposure);
      const childName = `${firstName} ${lastName}`;
      const balance = Math.abs(amount);

      if (amount < 0) {
        paymentReceivingFrom.push({ id: childId, name: childName, balance });
      } else if (amount > 0) {
        paymentPaidTo.push({ id: childId, name: childName, balance });
      } else {
        paymentCleared.push({ id: childId, name: childName, balance });
      }
    });

    // Return response
    return res.status(200).json({
      uniqueCode: "CGP0075",
      message:
        transactions.length > 0
          ? "Collection report fetched successfully"
          : "No transactions found",
      data: { paymentReceivingFrom, paymentPaidTo, paymentCleared },
    });
  } catch (error) {
    console.error("Error fetching collection report:", error);
    return res.status(500).json({
      uniqueCode: "CGP0076",
      message: "Internal server error",
      data: {},
    });
  }
}
