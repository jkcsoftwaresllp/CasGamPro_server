import {
  validateLength,
  validateEnum,
  validateRuleCodeFormat,
} from "../utils/validators.js";

export const validateRequest = (req, res, next) => {
  const { ruleCode, type, language, rule } = req.body;

  // Validate ruleCode
  if (!ruleCode || !validateRuleCodeFormat(ruleCode)) {
    return res.status(400).json({
      status: "error",
      message:
        "Invalid ruleCode format. Only uppercase letters, numbers, and underscores are allowed.",
    });
  }

  // Validate type
  if (!type || !validateEnum(type, ["ADMIN", "AGENT", "CLIENT"])) {
    return res.status(400).json({
      status: "error",
      message: 'Invalid type. Allowed values are "admin", "agent", "client".',
    });
  }

  // Validate language
  if (!language || !validateEnum(language, ["ENG", "HIN"])) {
    return res.status(400).json({
      status: "error",
      message: 'Invalid language. Allowed values are "eng" and "hin".',
    });
  }

  // Validate rule length
  if (!rule || !validateLength(rule, 10, 1000)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid rule. It must be between 10 and 1000 characters.",
    });
  }

  next();
};
