/**
 * Helper function to create consistent API responses.
 * @param {string} type - "success" or "error"
 * @param {string} uniqueCode - Unique error/success code
 * @param {string} message - Response message
 * @param {Object} [data={}] - Optional data object
 * @returns {Object} Response object
 */
export const createResponse = (type, uniqueCode, message, data = {}) => ({
  uniqueCode,
  message,
  data,
  status: type === "success" ? "success" : "error",
});
