import { db } from "../database/database.js";
import { ledger } from "../database/schema.js";
import { eq } from "drizzle-orm";

export const getLedgerEntryById = async (req, res) => {
  try {
    const { id } = req.user.id;
    const entry = await db
      .select()
      .from(ledger)
      .where(eq(ledger.id, parseInt(id)));

    if (entry.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ledger entry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: entry[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching ledger entry",
      error: error.message,
    });
  }
};
