const { errorResponse } = require('../utils/apiResponse');

// In-memory request timestamp log: Map<key, number[]>
const requestLogMap = new Map();

/**
 * Generic sliding window rate limiter factory
 */
const createRateLimiter = (namespace, windowMs, maxHits, customMessage) => {
  return (req, res, next) => {
    // Key by namespace + authenticated user ID if available, otherwise client IP
    const userOrIp = req.user ? req.user._id.toString() : (req.ip || req.headers['x-forwarded-for'] || 'anonymous');
    const key = `${namespace}:${userOrIp}`;
    const now = Date.now();

    let timestamps = requestLogMap.get(key) || [];

    // Filter out timestamps outside the active window
    timestamps = timestamps.filter((time) => now - time < windowMs);

    if (timestamps.length >= maxHits) {
      const oldestTime = timestamps[0];
      const retryAfterSec = Math.ceil((windowMs - (now - oldestTime)) / 1000);
      res.setHeader('Retry-After', retryAfterSec);

      const msg = customMessage || `Too many requests. Please wait ${retryAfterSec} seconds before trying again.`;
      return errorResponse(res, 429, msg);
    }

    timestamps.push(now);
    requestLogMap.set(key, timestamps);
    next();
  };
};

/**
 * Rate limiting middleware for AI Assistant endpoints (30 req / 15 min)
 */
const aiRateLimiter = (windowMs = 15 * 60 * 1000, maxHits = 30) => {
  return createRateLimiter(
    'ai',
    windowMs,
    maxHits,
    'Too many AI assistant requests. Please wait before sending another message.'
  );
};

/**
 * Rate limiting middleware for Authentication endpoints (login/register: 10 req / 15 min)
 */
const authRateLimiter = (windowMs = 15 * 60 * 1000, maxHits = 10) => {
  return createRateLimiter(
    'auth',
    windowMs,
    maxHits,
    'Too many authentication attempts. Please wait 15 minutes before trying again.'
  );
};

/**
 * Rate limiting middleware for Expensive Computation endpoints (insights/review: 60 req / 15 min)
 */
const expensiveOpsLimiter = (windowMs = 15 * 60 * 1000, maxHits = 60) => {
  return createRateLimiter(
    'expensive',
    windowMs,
    maxHits,
    'Rate limit exceeded for analytics generation. Please slow down request frequency.'
  );
};

/**
 * Rate limiting middleware for general API protection (200 req / 15 min)
 */
const apiRateLimiter = (windowMs = 15 * 60 * 1000, maxHits = 200) => {
  return createRateLimiter(
    'api',
    windowMs,
    maxHits,
    'Too many requests to the server. Please wait before making more requests.'
  );
};

module.exports = {
  createRateLimiter,
  aiRateLimiter,
  authRateLimiter,
  expensiveOpsLimiter,
  apiRateLimiter
};
