const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB using Mongoose.
 * Logs successful connection or connection error gracefully.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Modern mongoose default options
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    console.warn('[Database Notice] API running without database connection. Ensure MongoDB service is running if database access is needed.');
  }
};

module.exports = connectDB;
