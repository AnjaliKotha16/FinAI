const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authRateLimiter } = require('../middleware/rateLimiterMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', authRateLimiter(15 * 60 * 1000, 10), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user & get token
 * @access  Public
 */
router.post('/login', authRateLimiter(15 * 60 * 1000, 10), login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get('/me', protect, getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public / Private
 */
router.post('/logout', logout);

module.exports = router;
