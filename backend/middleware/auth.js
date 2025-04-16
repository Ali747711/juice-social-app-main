// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const TokenBlacklist = require('../models/TokenBlacklist.js');

/**
 * Authentication middleware to protect routes
 * Verifies JWT token, checks if it's not blacklisted, and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        status: 'error',
        code: 'AUTH_NO_TOKEN',
        message: 'No authentication token, access denied' 
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'Your session has expired, please login again'
        });
      }
      
      return res.status(401).json({
        status: 'error',
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid authentication token'
      });
    }
    
    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({
        status: 'error',
        code: 'AUTH_TOKEN_REVOKED',
        message: 'This token has been revoked, please login again'
      });
    }
    
    // Find user by id
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        code: 'AUTH_USER_NOT_FOUND',
        message: 'User not found'
      });
    }
    
    // Check if token was issued before password change
    const tokenIssuedAt = new Date(decoded.iat * 1000);
    if (user.passwordChangedAt && tokenIssuedAt < user.passwordChangedAt) {
      return res.status(401).json({
        status: 'error',
        code: 'AUTH_PASSWORD_CHANGED',
        message: 'Password has been changed, please login again'
      });
    }
    
    // Add user and token data to request object
    req.user = user;
    req.userId = user._id;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'An error occurred during authentication'
    });
  }
};

module.exports = auth;