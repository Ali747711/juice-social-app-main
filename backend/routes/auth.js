// routes/auth.js
import TokenBlacklist from './TokenBlacklist';

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const TokenBlacklist = require('../models/TokenBlacklist');

const router = express.Router();

// Input validation middleware
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters')
    .isAlphanumeric().withMessage('Username can only contain letters and numbers'),
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
];

const validateLogin = [
  body('username').trim().notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const validateProfileUpdate = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('bio').optional().trim().isLength({ max: 160 }).withMessage('Bio cannot exceed 160 characters'),
  body('darkMode').optional().isBoolean().withMessage('Dark mode must be a boolean value')
];

const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
    .not().equals(body('currentPassword')).withMessage('New password must be different from current password')
];

// Register a new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { username, email, password, fullName } = req.body;
    
    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ 
        message: 'Username is already taken',
        field: 'username' 
      });
    }
    
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ 
        message: 'Email is already registered',
        field: 'email' 
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password,  // This will be hashed by the pre-save hook
      fullName
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    // Return user info and token (excluding password)
    const userObject = user.toObject();
    delete userObject.password;
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userObject
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { username, password } = req.body;
    
    // Find user by username or email
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid username/email or password' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username/email or password' });
    }
    
    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    // Return user info and token (excluding password)
    const userObject = user.toObject();
    delete userObject.password;
    
    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: userObject
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    // User is already attached to req by the auth middleware
    const userObject = req.user.toObject();
    delete userObject.password;
    
    res.status(200).json({ user: userObject });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout user
router.post('/logout', auth, async (req, res) => {
  try {
    // 1. Update user's online status
    req.user.isOnline = false;
    req.user.lastSeen = new Date();
    await req.user.save();
    
    // 2. Add the token to blacklist
    await new TokenBlacklist({
      token: req.token,
      userId: req.user._id
    }).save();
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
      clientAction: 'Please remove the JWT token from your storage'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Server error during logout',
      error: error.message
    });
  }
});

// Add a new endpoint to logout from all devices
router.post('/logout-all', auth, async (req, res) => {
  try {
    // 1. Update user's online status
    req.user.isOnline = false;
    req.user.lastSeen = new Date();
    
    // 2. Update password changed timestamp to invalidate all existing tokens
    req.user.passwordChangedAt = new Date();
    await req.user.save();
    
    // 3. Add current token to blacklist
    await new TokenBlacklist({
      token: req.token,
      userId: req.user._id
    }).save();
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out from all devices successfully',
      clientAction: 'Please remove the JWT token from your storage'
    });
  } catch (error) {
    console.error('Logout from all devices error:', error);
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Server error during logout from all devices',
      error: error.message
    });
  }
});


// Update user profile
router.put('/profile', auth, validateProfileUpdate, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { fullName, bio, darkMode } = req.body;
    const updatedFields = {};
    
    // Only update provided fields
    if (fullName !== undefined) updatedFields.fullName = fullName;
    if (bio !== undefined) updatedFields.bio = bio;
    if (darkMode !== undefined) updatedFields.darkMode = darkMode;
    
    // If no fields to update
    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ message: 'No profile data provided to update' });
    }
    
    // Update user and get the updated document
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updatedFields },
      { new: true }
    );
    
    // Return updated user (excluding password)
    const userObject = updatedUser.toObject();
    delete userObject.password;
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: userObject
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.put('/change-password', auth, validatePasswordChange, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;
    
    // Verify current password
    const isMatch = await req.user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Current password is incorrect',
        field: 'currentPassword'
      });
    }
    
    // Update password
    req.user.password = newPassword;
    await req.user.save();
    
    res.status(200).json({ 
      message: 'Password changed successfully',
      // Optionally invalidate other sessions
      clientAction: 'Consider re-authenticating for security'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;