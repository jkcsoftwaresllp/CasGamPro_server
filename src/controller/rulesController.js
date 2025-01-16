import { db } from "../config/db.js";
import { rules } from "../database/schema.js";
export const rulesController = {
  //create a new rule
  createRule: async (req, res) => {
    try {
      const { ruleCode, type, language, rule } = req.body;
      if (!ruleCode || !type || !language || !rule) {
        return res
          .status(400)
          .json({ success: false, message: "All fields are required." });
      }
      // Validate ruleCode: Must be a hexadecimal string
      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(ruleCode)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ruleCode. Must be a hexadecimal string.",
        });
      }
      // Validate type: Must be "AGENT" or "ADMIN"
      if (type !== "ADMIN" && type !== "AGENT") {
        return res.status(400).json({
          success: false,
          message: "Invalid type. Must be 'AGENT' or 'ADMIN'.",
        });
      }
      // Validate language: Must be "hindi" or "english"
      if (language !== "HIN" && language !== "ENG") {
        return res.status(400).json({
          success: false,
          message: "Invalid language. Must be 'hindi' or 'english'.",
        });
      }
      // Rule text must match the language
      const isHindi = /[\u0900-\u097F]/.test(rule);
      const isEnglish = /^[a-zA-Z0-9\s.,!?']+$/.test(rule);

      if (
        (language === "HIN" && !isHindi) ||
        (language === "ENG" && !isEnglish)
      ) {
        return res.status(400).json({
          success: false,
          message: `The rule text must match the specified language (${language}).`,
        });
      }

      //Insert rule into the database
      await db.insert(rules).value({ ruleCode, type, language, rule });
      res.status(201).json({
        uniqueCode: "CGP00013D",
        success: true,
        message: "Rule created successfully.",
      });
    } catch (err) {
      console.error("Error in creating rule", err);
      res
        .status(500)
        .json({ success: false, message: "Failed to create rule." });
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
    try {
      const { type, language } = req.query;
      let query = db.select().from(rules);
      if (type) query = query.where(rules.type.eq(type));
      if (language) query = query.where(rules.language.eq(language));
      const result = await query;
      res
        .status(200)
        .json({ uniqueCode: "CGP00013B", success: true, data: result });
    } catch (err) {
      console.error("Error in fetching rule", err);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch rule." });
    }
  },
  //Delete rule
  deleteRule: async (req, res) => {
    try {
      const { ruleCode } = req.params;

      const result = await db.delete(rules).where(rules.ruleCode.eq(ruleCode));

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Rule not found." });
      }
      res.status(200).json({
        uniqueCode: "CGP00013A",
        success: true,
        message: "Rule deleted successfully.",
      });
    } catch (err) {
      console.error("Error in deleting rule", err);
      res
        .status(500)
        .json({ success: false, message: "Failed to delete rule." });
    }
  },
};
