import { db } from "../config/db.js";
import { rules } from "../database/schema.js";
import { validateRequest } from "../middleware/validateRuleFields.js";
export const rulesController = {
  //create a new rule
  createRule: async (req, res) => {
    try {
      const { rules: rulesArray } = req.body;
      const results = [];
      for (const ruleData of rulesArray) {
        // Validate rule fields
        const validationErrors = validateRequest(ruleData);
        if (validationErrors.length > 0) {
          return res.status(400).json({
            uniqueCode: "CGP00013E",
            success: false,
            message: "Validation failed.",
            errors: validationErrors,
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
            uniqueCode: "CGP00013H",
            status: "error",
            message: `Rule code ${ruleData.ruleCode} already exists.`,
            data: { ruleCode: ruleData.ruleCode },
          });
        }

        //Insert rule into the database
        const newRule = await db.insert(rules).value(ruleData);
        results.push(newRule);
      }
      return res.status(201).json({
        uniqueCode: "CGP00013D",
        success: true,
        message: "Rule created successfully.",
        data: results,
      });
    } catch (err) {
      console.error("Error in creating rule", err);
      res.status(500).json({
        uniqueCode: "CGP00013I",
        success: false,
        message: "Failed to create rule.",
      });
    }
  },

  //update an existing rule
  updateRule: async (req, res) => {
    try {
      const { ruleCode } = req.params;
      const update = req.body;
      const result = await db
        .update(rules)
        .set(update)
        .where(rules.ruleCode.eq(ruleCode));

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Rule not found." });
      }
      res.status(200).json({
        uniqueCode: "CGP00013C",
        success: true,
        message: "Rule updated successfully.",
      });
    } catch (err) {
      console.error("Error in updating rule", err);
      res
        .status(500)
        .json({ success: false, message: "Failed to update rule." });
    }
  },

  //Fetch rule
  fetchRule: async (req, res) => {
    const { language } = req.query;
    if (!["ENG", "HIN"].includes(language)) {
      return res.status(400).json({
        uniqueCode: "CGP00013F",
        status: "error",
        message: 'Invalid language. Supported languages are "eng" and "hin".',
      });
    }
    try {
      const result = await db.select().from(rules).where({ language });
      return res.status(200).json({
        uniqueCode: "CGP00013B",
        success: true,
        data: {
          id: result.id,
          ruleCode: result.ruleCode,
          type: result.type,
          language: result.language,
          rule: result.rule,
        },
      });
    } catch (err) {
      console.error("Error in fetching rule", err);
      res.status(500).json({
        uniqueCode: "CGP00013G",
        success: false,
        message: "Failed to fetch rule.",
        data: {},
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
          uniqueCode: "CGP00013J",
          success: false,
          message: "Rule not found.",
        });
      }
      res.status(200).json({
        uniqueCode: "CGP00013A",
        success: true,
        message: "Rule deleted successfully.",
      });
    } catch (err) {
      console.error("Error in deleting rule", err);
      res.status(500).json({
        uniqueCode: "CGP00013K",
        success: false,
        message: "Failed to delete rule.",
      });
    }
  },
};
