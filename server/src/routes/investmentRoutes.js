const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, getPlan, simulate } = require('../controllers/investmentController');
const { validateUpdateProfile, validateSimulate } = require('../validators/investmentValidator');

// Enforce authentication on all investment routes
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validateUpdateProfile, updateProfile);
router.get('/plan', getPlan);
router.get('/plan/:goalId', getPlan);
router.post('/simulate', validateSimulate, simulate);

module.exports = router;
