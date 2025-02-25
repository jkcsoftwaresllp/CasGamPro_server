import { db } from "../../config/db.js";
import { rules } from "../../database/schema.js";
import { logger } from "../../logger/logger.js";
import { validateRuleFields } from "../../middleware/validateRuleFields.js";  
export const createRule = async (req, res) => {
  try {
    const { rules: rulesArray } = req.body;
    const results = [];
    for (const ruleData of rulesArray) {
      // Validate rule fields
      if (!validateRuleFields({ body: ruleData })) {
        return res.status(400).json({
          uniqueCode: "CGP0000A",
          message: "Validation failed. Please check the rule data.",
          data: {
            success: false,
          },
        });
      }

      // Check if ruleCode is unique
      const existingRule = await db
        .select()
        .from(rules)
        .where({ ruleCode: ruleData.ruleCode })
        .first();
      if (existingRule) {
        return res.status(400).json({
          uniqueCode: "CGP0000B",
          message: `Rule code ${ruleData.ruleCode} already exists.`,
          data: { status: "error", ruleCode: ruleData.ruleCode },
        });
      }

      //Insert rule into the database
      const newRule = await db.insert(rules).values(ruleData);
      results.push(newRule);
    }
    return res.status(201).json({
      uniqueCode: "CGP0000C",
      message: "Rule created successfully.",
      data: { success: true, results },
    });
  } catch (err) {
    logger.error("Error in creating rule", err);
    res.status(500).json({
      uniqueCode: "CGP0000D",
      message: "Failed to create rule.",
      data: {
        success: false,
      },
    });
  }
};
