const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const logger = require('./utils/logger');

const { setSecurityHeaders, sanitizeInputs } = require('./middleware/securityMiddleware');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security HTTP Headers (Helmet-equivalent)
app.use(setSecurityHeaders);

// Configure CORS for local frontend/backend development
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Standard middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global input sanitization to prevent NoSQL injection
app.use(sanitizeInputs);

// Connect to MongoDB
connectDB();

// Root route welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FinAI API - Phase 0 Foundation',
    healthCheck: '/api/health',
    version: '1.0.0'
  });
});

// Mount API Routes
app.use('/api', apiRoutes);

// Centralized 404 Route Not Found Handler
app.use(notFoundHandler);

// Centralized Error Handler Middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/api/health`);
});

module.exports = app;
