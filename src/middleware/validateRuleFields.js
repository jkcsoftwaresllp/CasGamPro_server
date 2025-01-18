import {
  validateLength,
  validateEnum,
  validateRuleCodeFormat,
} from "../utils/validators.js";
import { RULE_TYPES } from "../utils/ruleTypes.js";

export const validateRequest = (req, res, next) => {
  const { ruleCode, type, language, rule } = req.body;

  // Validate ruleCode
  if (!ruleCode || !validateRuleCodeFormat(ruleCode)) {
    return res.status(400).json({
      uniqueCode: "CGP00111",
      message:
        "Invalid ruleCode format. Only uppercase letters, numbers, and underscores are allowed.",
      data: {},
    });
  }

  // Validate type
  const validTypes = Object.values(RULE_TYPES);
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      uniqueCode: "CGP00112",
      message: `Invalid type. Allowed types are: ${validTypes.join(", ")}`,
      data: {},
    });
  }

  // Validate language
  if (!language || !validateEnum(language, ["ENG", "HIN"])) {
    return res.status(400).json({
      uniqueCode: "CGP00113",
      message: 'Invalid language. Allowed values are "ENG" and "HIN".',
      data: {},
    });
  }

  // Validate rule length
  if (!rule || !validateLength(rule, 10, 1000)) {
    return res.status(400).json({
      uniqueCode: "CGP00114",
      message: "Invalid rule. It must be between 10 and 1000 characters.",
      data: {},
    });
  }

  next();
};
