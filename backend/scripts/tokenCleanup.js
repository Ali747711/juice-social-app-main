// scripts/tokenCleanup.js
/**
 * Script to clean up expired tokens from the blacklist
 * This can be run as a cron job to ensure the blacklist doesn't grow too large
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TokenBlacklist = require('../models/TokenBlacklist');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB for token cleanup'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function cleanupExpiredTokens() {
  try {
    console.log('Starting token cleanup process...');
    
    // TTL index should handle most of this automatically,
    // but we can do manual cleanup for tokens older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const result = await TokenBlacklist.deleteMany({
      createdAt: { $lt: sevenDaysAgo }
    });
    
    console.log(`Cleaned up ${result.deletedCount} expired tokens`);
    
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up tokens:', error);
    throw error;
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupExpiredTokens()
    .then(count => {
      console.log(`Token cleanup completed. Removed ${count} expired tokens.`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Token cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = cleanupExpiredTokens;