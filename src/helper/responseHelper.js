/**
 * Creates a standardized response object
 * @param {string} status - 'success' or 'error'
 * @param {string} code - Unique response code
 * @param {string} message - Response message
 * @param {Object} [data] - Optional data object
 * @returns {Object} Standardized response object
 */
export const createResponse = (status, code, message, data = {}) => {
    return {
      uniqueCode: code,
      status,
      message,
      data,
    };
  };