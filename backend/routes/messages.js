// routes/messages.js
const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendSuccess, sendError, formatValidationErrors } = require('../utils/responseHelper');
const mongoose = require('mongoose');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept common file types
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.test(ext.substring(1))) {
      return cb(null, true);
    }
    
    cb(new Error('Invalid file type. Only images, videos, documents, and archives are allowed.'));
  }
});

// Validation middlewares
const validateUserId = [
  param('userId')
    .isMongoId().withMessage('Invalid user ID format')
];

const validateMessageId = [
  param('messageId')
    .isMongoId().withMessage('Invalid message ID format')
];

const validateGetMessages = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const validateSendMessage = [
  body('content')
    .optional()
    .isString().withMessage('Content must be a string')
    .isLength({ max: 5000 }).withMessage('Message content cannot exceed 5000 characters')
];

// Get conversation with a specific user (with pagination)
router.get('/:userId', auth, validateUserId, validateGetMessages, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 'VALIDATION_ERROR', formatValidationErrors(errors));
    }

    const otherUserId = req.params.userId;
    
    // Verify the other user exists
    const otherUser = await User.findById(otherUserId).select('_id fullName username profilePicture');
    if (!otherUser) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', null, 404);
    }
    
    // Set up pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Find messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: otherUserId },
        { sender: otherUserId, receiver: req.userId }
      ]
    })
    .sort({ createdAt: -1 }) // Sort by newest first
    .skip(skip)
    .limit(limit)
    .lean();
    
    // Get total messages count for pagination
    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: req.userId, receiver: otherUserId },
        { sender: otherUserId, receiver: req.userId }
      ]
    });
    
    // Sort messages chronologically for display (oldest first)
    messages.sort((a, b) => a.createdAt - b.createdAt);
    
    // Get unread count in this conversation
    const unreadCount = await Message.countDocuments({
      sender: otherUserId,
      receiver: req.userId,
      read: false
    });
    
    // Don't mark messages as read automatically
    // This will be done when individual messages are viewed or explicitly marked as read
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalMessages / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return sendSuccess(res, 'Messages retrieved successfully', {
      messages,
      conversation: {
        user: otherUser,
        unreadCount
      },
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return sendError(res, 'Failed to retrieve messages', 'SERVER_ERROR', null, 500);
  }
});

// Mark specific messages as read
router.put('/:messageId/read', auth, validateMessageId, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 'VALIDATION_ERROR', formatValidationErrors(errors));
    }

    const messageId = req.params.messageId;
    
    // Find the message and ensure it belongs to current user
    const message = await Message.findOne({
      _id: messageId,
      receiver: req.userId,
      read: false
    });
    
    if (!message) {
      return sendError(
        res, 
        'Message not found or already read', 
        'MESSAGE_NOT_FOUND', 
        null, 
        404
      );
    }
    
    // Mark message as read
    message.read = true;
    message.readAt = new Date();
    await message.save();
    
    return sendSuccess(res, 'Message marked as read');
  } catch (error) {
    console.error('Mark message read error:', error);
    return sendError(res, 'Failed to mark message as read', 'SERVER_ERROR', null, 500);
  }
});

// Mark all messages from a specific user as read
router.put('/user/:userId/read', auth, validateUserId, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 'VALIDATION_ERROR', formatValidationErrors(errors));
    }

    const otherUserId = req.params.userId;
    
    // Update all unread messages from the other user
    const result = await Message.updateMany(
      { sender: otherUserId, receiver: req.userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    
    return sendSuccess(res, 'Messages marked as read', {
      markedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all messages read error:', error);
    return sendError(res, 'Failed to mark messages as read', 'SERVER_ERROR', null, 500);
  }
});

// Get latest conversations (list of users with latest message)
router.get('/', auth, async (req, res) => {
  try {
    // Find all unique users the current user has interacted with
    const conversations = await Message.aggregate([
      // Match messages where current user is sender or receiver
      {
        $match: {
          $or: [
            { sender: mongoose.Types.ObjectId(req.userId) },
            { receiver: mongoose.Types.ObjectId(req.userId) }
          ]
        }
      },
      // Sort by createdAt (newest first)
      { $sort: { createdAt: -1 } },
      // Group by the other user in the conversation
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', mongoose.Types.ObjectId(req.userId)] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      // Lookup user details for the other user
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      // Unwind the user array
      { $unwind: '$user' },
      // Count unread messages per conversation
      {
        $lookup: {
          from: 'messages',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$sender', '$$userId'] },
                    { $eq: ['$receiver', mongoose.Types.ObjectId(req.userId)] },
                    { $eq: ['$read', false] }
                  ]
                }
              }
            },
            { $count: 'count' }
          ],
          as: 'unreadMessages'
        }
      },
      // Project only needed fields
      {
        $project: {
          user: {
            _id: 1,
            username: 1,
            fullName: 1,
            profilePicture: 1,
            isOnline: 1,
            lastSeen: 1
          },
          lastMessage: {
            _id: 1,
            content: 1,
            createdAt: 1,
            read: 1,
            sender: 1,
            receiver: 1,
            files: 1
          },
          unreadCount: {
            $cond: [
              { $eq: [{ $size: '$unreadMessages' }, 0] },
              0,
              { $arrayElemAt: ['$unreadMessages.count', 0] }
            ]
          }
        }
      },
      // Sort by last message date
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);
    
    return sendSuccess(res, 'Conversations retrieved', { conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return sendError(res, 'Failed to retrieve conversations', 'SERVER_ERROR', null, 500);
  }
});

// Get unread messages count (total and per conversation)
router.get('/unread/count', auth, async (req, res) => {
  try {
    // Get total unread count
    const totalCount = await Message.countDocuments({
      receiver: req.userId,
      read: false
    });
    
    // Get unread count per conversation (user)
    const unreadByUser = await Message.aggregate([
      // Match unread messages for the current user
      {
        $match: {
          receiver: mongoose.Types.ObjectId(req.userId),
          read: false
        }
      },
      // Group by sender
      {
        $group: {
          _id: '$sender',
          count: { $sum: 1 }
        }
      },
      // Lookup sender details
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      // Unwind the user array
      { $unwind: '$user' },
      // Project only needed fields
      {
        $project: {
          user: {
            _id: 1,
            username: 1,
            fullName: 1,
            profilePicture: 1
          },
          count: 1
        }
      }
    ]);
    
    return sendSuccess(res, 'Unread message counts retrieved', {
      total: totalCount,
      byUser: unreadByUser
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return sendError(res, 'Failed to retrieve unread message count', 'SERVER_ERROR', null, 500);
  }
});

// Send a message (REST API version as fallback for Socket.IO)
router.post('/:userId', auth, validateUserId, validateSendMessage, upload.array('files', 5), async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 'VALIDATION_ERROR', formatValidationErrors(errors));
    }

    const { content } = req.body;
    const receiverId = req.params.userId;
    
    // Check if receiver exists
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return sendError(res, 'Recipient user not found', 'USER_NOT_FOUND', null, 404);
    }
    
    // Prepare file attachments
    const files = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Determine file type
        let type = 'file';
        if (file.mimetype.startsWith('image/')) {
          type = 'image';
        } else if (file.mimetype.startsWith('video/')) {
          type = 'video';
        }
        
        files.push({
          name: file.originalname,
          size: file.size,
          type,
          url: `/uploads/${file.filename}`,
          path: file.path
        });
      }
    }
    
    // Validate that we have either content or files
    if (!content && files.length === 0) {
      return sendError(res, 'Message must have either content or files', 'INVALID_MESSAGE');
    }
    
    // Create new message
    const message = new Message({
      sender: req.userId,
      receiver: receiverId,
      content: content || '',
      files
    });
    
    await message.save();
    
    // Populate sender info
    const populatedMessage = await Message.findById(message._id);
    
    return sendSuccess(res, 'Message sent successfully', { message: populatedMessage }, 201);
  } catch (error) {
    console.error('Send message error:', error);
    return sendError(res, 'Failed to send message', 'SERVER_ERROR', null, 500);
  }
});

// Delete a message
router.delete('/:messageId', auth, validateMessageId, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 'VALIDATION_ERROR', formatValidationErrors(errors));
    }

    const messageId = req.params.messageId;
    
    // Find the message and ensure it belongs to current user
    const message = await Message.findOne({
      _id: messageId,
      sender: req.userId
    });
    
    if (!message) {
      return sendError(
        res, 
        'Message not found or you do not have permission to delete it', 
        'MESSAGE_NOT_FOUND', 
        null, 
        404
      );
    }
    
    // Check if message is recent (less than 1 hour old)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (message.createdAt < oneHourAgo) {
      return sendError(
        res, 
        'Cannot delete messages older than 1 hour', 
        'MESSAGE_TOO_OLD'
      );
    }
    
    // Delete any attached files if needed
    if (message.files && message.files.length > 0) {
      for (const file of message.files) {
        if (file.path) {
          fs.unlink(file.path, (err) => {
            if (err) console.error(`Failed to delete file: ${file.path}`);
          });
        }
      }
    }
    
    // Delete the message
    await message.remove();
    
    return sendSuccess(res, 'Message deleted successfully');
  } catch (error) {
    console.error('Delete message error:', error);
    return sendError(res, 'Failed to delete message', 'SERVER_ERROR', null, 500);
  }
});

module.exports = router;
