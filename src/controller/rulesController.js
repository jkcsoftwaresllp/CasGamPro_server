import { db } from "../config/db.js";
import { rules } from "../database/schema.js";
import { logger } from "../logger/logger.js";
import { validateRuleFields } from "../middleware/validateRuleFields.js";
export const rulesController = {
  //create a new rule
  createRule: async (req, res) => {
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
  },

  //update an existing rule
  updateRule: async (req, res) => {
    try {
      const { ruleCode } = req.params;
      const update = req.body;

      // Validate rule fields
      if (!validateRequest({ body: update })) {
        return res.status(400).json({
          uniqueCode: "CGP0000E",
          message: "Validation failed. Please check the updated rule data.",
          data: { success: false },
        });
      }
      const result = await db
        .update(rules)
        .set(update)
        .where(rules.ruleCode.eq(ruleCode));

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
  },

  //Fetch rule
  // Fetch rules based on the language query parameter
  fetchRule: async (req, res) => {
    const { language } = req.query;
    if (!["ENG", "HIN"].includes(language)) {
      return res.status(400).json({
        uniqueCode: "CGP0000I",
        message:
          'Invalid language. Supported languages are "English" and "Hindi".',
        data: { status: "error" },
      });
    }
    try {
      const result = await db.select().from(rules).where({ language });

      // Format the rules for the response
      const formattedRules = result.map((rule) => ({
        id: rule.id,
        rule: rule.rule,
        language: rule.language,
      }));

      return res.status(200).json({
        uniqueCode: "CGP0000J",
        success: true,
        data: formattedRules,
      });
    } catch (err) {
      logger.error("Error in fetching rule", err);
      res.status(500).json({
        uniqueCode: "CGP0000K",
        message: "Failed to fetch rule.",
        data: { success: false },
      });
    }
  },
  //Delete rule
  deleteRule: async (req, res) => {
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
  },
};
