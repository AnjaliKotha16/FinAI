const logger = require('../utils/logger');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Centralized Global Error Handler Middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message || 'Unhandled error'}`);

  const statusCode = err.statusCode || res.statusCode !== 200 ? res.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, statusCode, message, process.env.NODE_ENV === 'development' ? err.stack : undefined);
};

module.exports = errorHandler;
