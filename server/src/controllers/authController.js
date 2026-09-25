const User = require('../models/User');
const { generateToken } = require('../utils/token');
const { validateRegisterInput, validateLoginInput } = require('../validators/authValidator');
const { errorResponse } = require('../utils/apiResponse');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate inputs
    const { isValid, errors } = validateRegisterInput(name, email, password);
    if (!isValid) {
      const firstErrorMsg = Object.values(errors)[0] || 'Please provide all required fields.';
      return errorResponse(res, 400, firstErrorMsg, errors);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if user with this email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 400, 'An account with this email already exists.');
    }

    // 3. Create user (password automatically hashed via User pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password
    });

    // 4. Generate JWT token
    const token = generateToken(user._id);

    // 5. Send success response (omitting password)
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    const { isValid, errors } = validateLoginInput(email, password);
    if (!isValid) {
      const firstErrorMsg = Object.values(errors)[0] || 'Please provide all required fields.';
      return errorResponse(res, 400, firstErrorMsg, errors);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find user by email (explicitly selecting password field)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    // 3. Compare password with bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    // 4. Generate JWT token
    const token = generateToken(user._id);

    // 5. Send success response (omitting password)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private (Protected by authMiddleware)
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // req.user is attached by authMiddleware
    return res.status(200).json({
      success: true,
      user: req.user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (stateless acknowledgement)
 * @access  Public / Private
 */
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout
};
