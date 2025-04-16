// models/TokenBlacklist.js
const mongoose = require('mongoose');

/**
 * Schema for blacklisted tokens
 * Used to track revoked tokens and implement logout functionality
 */
const TokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d' // Automatically delete entries after token expiry (matching JWT expiry)
  }
});

// Index to improve query performance
TokenBlacklistSchema.index({ token: 1 });
TokenBlacklistSchema.index({ userId: 1 });

module.exports = mongoose.model('TokenBlacklist', TokenBlacklistSchema);