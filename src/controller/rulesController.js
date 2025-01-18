import { db } from "../config/db.js";
import { rules } from "../database/schema.js";
import { validateRuleFields } from "../middleware/validateRuleFields.js";
export const rulesController = {
  //create a new rule
  createRule: async (req, res) => {
    try {
      const { rules: rulesArray } = req.body;
      const results = [];
      for (const ruleData of rulesArray) {
        // Validate rule fields
        const validationErrors = validateRuleFields(ruleData);
        if (!validateRequest({ body: ruleData })) {
          return res.status(400).json({
            uniqueCode: "CGP00013A",
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
            uniqueCode: "CGP00013B",
            message: `Rule code ${ruleData.ruleCode} already exists.`,
            data: { status: "error", ruleCode: ruleData.ruleCode },
          });
        }

        //Insert rule into the database
        const newRule = await db.insert(rules).value(ruleData);
        results.push(newRule);
      }
      return res.status(201).json({
        uniqueCode: "CGP00013C",
        message: "Rule created successfully.",
        data: { success: true, results },
      });
    } catch (err) {
      console.error("Error in creating rule", err);
      res.status(500).json({
        uniqueCode: "CGP00013D",
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
          uniqueCode: "CGP00013E",
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
          uniqueCode: "CGP00013F",
          message: "Rule not found.",
          data: { success: false },
        });
      }
      res.status(200).json({
        uniqueCode: "CGP00013G",
        message: "Rule updated successfully.",
        data: { success: true },
      });
    } catch (err) {
      console.error("Error in updating rule", err);
      res.status(500).json({
        uniqueCode: "CGP00013H",
        message: "Failed to update rule.",
        data: { success: false },
      });
    }
  },

  //Fetch rule
  fetchRule: async (req, res) => {
    const { language } = req.query;
    if (!["ENG", "HIN"].includes(language)) {
      return res.status(400).json({
        uniqueCode: "CGP00013I",
        message: 'Invalid language. Supported languages are "eng" and "hin".',
        data: { status: "error" },
      });
    }
    try {
      const result = await db.select().from(rules).where({ language });
      return res.status(200).json({
        uniqueCode: "CGP00013J",
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
        uniqueCode: "CGP00013K",
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
          uniqueCode: "CGP00013L",
          message: "Rule not found.",
          data: { success: false },
        });
      }
      res.status(200).json({
        uniqueCode: "CGP00013M",
        message: "Rule deleted successfully.",
        data: { success: true },
      });
    } catch (err) {
      console.error("Error in deleting rule", err);
      res.status(500).json({
        uniqueCode: "CGP00013N",
        message: "Failed to delete rule.",
        data: { success: false },
      });
    }
  },
};
