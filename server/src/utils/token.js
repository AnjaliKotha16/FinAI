const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'default_jwt_secret_fallback') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in production!');
    } else {
      console.warn('SECURITY WARNING: Using fallback JWT secret for development. Set JWT_SECRET in .env!');
    }
    return 'development_fallback_jwt_secret_key_2026';
  }
  return secret;
};

/**
 * Generate a JWT token containing user ID in payload
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify a JWT token
 */
const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  generateToken,
  verifyToken
};
