const mongoose = require('mongoose');

/**
 * Controller for health check endpoint.
 * GET /api/health
 */
const getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).json({
    status: 'OK',
    message: 'FinAI API is running successfully',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStateMap[dbState] || 'unknown'
  });
};

module.exports = {
  getHealth
};
