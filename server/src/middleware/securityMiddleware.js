const mongoose = require('mongoose');

/**
 * Clean/Sanitize an object recursively by stripping NoSQL operator keys starting with '$' or containing '.'
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const cleanObj = {};
  for (const key of Object.keys(obj)) {
    // Strip keys starting with '$' (e.g. $gt, $ne, $where) or containing '.'
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    const value = obj[key];
    if (value && typeof value === 'object') {
      cleanObj[key] = sanitizeObject(value);
    } else {
      cleanObj[key] = value;
    }
  }

  return cleanObj;
};

/**
 * Global input sanitization middleware to prevent NoSQL injection attacks
 */
const sanitizeInputs = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

/**
 * Security HTTP headers middleware (equivalent to Helmet security headers)
 */
const setSecurityHeaders = (req, res, next) => {
  // Prevent clickjacking by disabling framing
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Enforce HSTS for HTTPS connections in non-development environments
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Hide Powered-By Express header
  res.removeHeader('X-Powered-By');

  // Restrict referrer info
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};

/**
 * Helper utility to validate whether a string is a valid 24-character hex MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
};

module.exports = {
  sanitizeObject,
  sanitizeInputs,
  setSecurityHeaders,
  isValidObjectId
};
