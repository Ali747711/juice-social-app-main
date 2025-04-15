// routes/users.js
const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Set up avatar upload directory
const avatarDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// Configure storage for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${req.userId}-${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// Set up multer for avatar uploads
const avatarUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB size limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow certain image types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  }
});

// Get all users (except current user)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('-password')
      .sort('-createdAt');
    
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search users by username or fullName
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const users = await User.find({
      $and: [
        { _id: { $ne: req.userId } },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { fullName: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('-password');
    
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/update', auth, async (req, res) => {
  try {
    const { fullName, bio } = req.body;
    
    // Build update object
    const updateFields = {};
    if (fullName) updateFields.fullName = fullName;
    if (bio !== undefined) updateFields.bio = bio;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateFields },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload avatar
router.post('/avatar', auth, (req, res) => {
  avatarUpload.single('avatar')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          message: 'File too large. Maximum file size is 5MB.' 
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      // An unknown error occurred
      return res.status(500).json({ success: false, message: err.message });
    }
    
    try {
      // Get user
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Delete old avatar file if exists
      if (user.profilePicture) {
        const oldAvatarPath = user.profilePicture.split('/').pop();
        const oldFilePath = path.join(avatarDir, oldAvatarPath);
        
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      // Set new avatar URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const avatarUrl = `${baseUrl}/api/users/avatar/${req.file.filename}`;
      
      // Update user with new avatar URL
      user.profilePicture = avatarUrl;
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        profilePicture: avatarUrl
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });
});

// Delete avatar
router.delete('/avatar', auth, async (req, res) => {
  try {
    // Get user
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if user has an avatar
    if (!user.profilePicture) {
      return res.status(400).json({ success: false, message: 'No avatar to delete' });
    }
    
    // Delete avatar file
    const avatarPath = user.profilePicture.split('/').pop();
    const filePath = path.join(avatarDir, avatarPath);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove avatar URL from user
    user.profilePicture = null;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Avatar deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Serve avatar images
router.get('/avatar/:filename', (req, res) => {
  const filePath = path.join(avatarDir, req.params.filename);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'Avatar not found' });
  }
});

module.exports = router;