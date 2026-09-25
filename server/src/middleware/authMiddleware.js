const { verifyToken } = require('../utils/token');
const { errorResponse } = require('../utils/apiResponse');
const User = require('../models/User');

/**
 * Authentication Middleware for protected REST API routes.
 * Verifies Bearer JWT in Authorization header and attaches req.user.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 401, 'Authentication token missing. Please log in to access this resource.');
  }

  try {
    const decoded = verifyToken(token);

    // Fetch user from DB using id from verified token
    const user = await User.findById(decoded.id);

    if (!user) {
      return errorResponse(res, 401, 'The user belonging to this token no longer exists.');
    }

    // Attach authenticated user object to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Your session has expired. Please log in again.');
    }
    return errorResponse(res, 401, 'Invalid authentication token.');
  }
};

module.exports = {
  protect
};
