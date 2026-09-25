const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const transactionRoutes = require('./transactionRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const budgetRoutes = require('./budgetRoutes');
const financialHealthRoutes = require('./financialHealthRoutes');
const goalRoutes = require('./goalRoutes');
const investmentRoutes = require('./investmentRoutes');
const aiRoutes = require('./aiRoutes');
const insightRoutes = require('./insightRoutes');
const monthlyReviewRoutes = require('./monthlyReviewRoutes');
const notificationRoutes = require('./notificationRoutes');

// Mount sub-routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/budgets', budgetRoutes);
router.use('/financial-health', financialHealthRoutes);
router.use('/goals', goalRoutes);
router.use('/investments', investmentRoutes);
router.use('/ai', aiRoutes);
router.use('/insights', insightRoutes);
router.use('/monthly-review', monthlyReviewRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
