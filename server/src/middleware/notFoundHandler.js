const { errorResponse } = require('../utils/apiResponse');

/**
 * 404 Route Not Found Handler Middleware
 */
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, 404, `Route not found: ${req.originalUrl}`);
};

module.exports = notFoundHandler;
