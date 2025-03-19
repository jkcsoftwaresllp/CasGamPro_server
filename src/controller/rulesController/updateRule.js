import { db } from "../../config/db.js";
import { rules } from "../../database/schema.js";
import { logger } from "../../logger/logger.js";
import { validateRuleFields } from "../../middleware/validateRuleFields.js";  
//update an existing rule
export const updateRule= async (req, res) => {
  try {
    const { rule_code } = req.params;
    const update = req.body;

    // Validate rule fields
    if (!validateRuleFields({ body: update })) {
      return res.status(400).json({
        uniqueCode: "CGP0000E",
        message: "Validation failed. Please check the updated rule data.",
        data: { success: false },
      });
    }
    const result = await db
      .update(rules)
      .set(update)
      .where(rules.rul_code.eq(rule_code));

    if (result.affectedRows === 0) {
      return res.status(404).json({
        uniqueCode: "CGP0000F",
        message: "Rule not found.",
        data: { success: false },
      });
    }
    res.status(200).json({
      uniqueCode: "CGP0000G",
      message: "Rule updated successfully.",
      data: { success: true },
    });
  } catch (err) {
    logger.error("Error in updating rule", err);
    res.status(500).json({
      uniqueCode: "CGP0000H",
      message: "Failed to update rule.",
      data: { success: false },
    });
  }
};