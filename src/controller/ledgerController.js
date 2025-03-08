import { db } from "../config/db.js";
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
        uniqueCode: "CGP0181",
        message: "Ledger entry not found",
        data: {},
      });
    }

    res.status(200).json({
      uniqueCode: "CGP0180",
      message: "Ledger entry retrieved successfully",
      data: entry[0],
    });
  } catch (error) {
    res.status(500).json({
      uniqueCode: "CGP0179",
      message: "Internal server error",
      data: {},
    });
  }
};
