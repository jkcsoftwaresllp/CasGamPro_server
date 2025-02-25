import { db } from "../../config/db.js";
import { rules } from "../../database/schema.js";
import { logger } from "../../logger/logger.js";

//Delete rule
export const deleteRule = async (req, res) => {
  try {
    const { ruleCode } = req.params;

    const result = await db.delete(rules).where(rules.ruleCode.eq(ruleCode));

    if (result.affectedRows === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0000L",
        message: "Rule not found.",
        data: { success: false },
      });
    }
    res.status(200).json({
      uniqueCode: "CGP0000M",
      message: "Rule deleted successfully.",
      data: { success: true },
    });
  } catch (err) {
    logger.error("Error in deleting rule", err);
    res.status(500).json({
      uniqueCode: "CGP0000N",
      message: "Failed to delete rule.",
      data: { success: false },
    });
  }
};
