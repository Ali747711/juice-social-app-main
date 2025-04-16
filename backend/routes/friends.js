// routes/friends.js
const express = require('express');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');
const { sendSuccess, sendError, formatValidationErrors } = require('../utils/responseHelper');

const router = express.Router();

// Validation middlewares
const validateRequestParams = [
  param('userId')
    .isMongoId().withMessage('Invalid user ID format')
];

const validateRequestIdParams = [
  param('requestId')
    .isMongoId().withMessage('Invalid request ID format')
];

const validateFriendIdParams = [
  param('friendId')
    .isMongoId().withMessage('Invalid friend ID format')
];

// Send friend request
router.post('/request/:userId', auth, validateRequestParams, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 'VALIDATION_ERROR', formatValidationErrors(errors));
    }

    const receiverId = req.params.userId;
    
    // Check if receiver exists
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', null, 404);
    }
    
    // Check if sender is trying to add themselves
    if (req.userId.toString() === receiverId) {
      return sendError(res, 'You cannot send a friend request to yourself', 'INVALID_REQUEST');
    }
    
    // Check if they are already friends
    if (req.user.friends.includes(receiverId)) {
      return sendError(res, 'You are already friends with this user', 'ALREADY_FRIENDS');
    }
    
    // Check if there's already a pending request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: req.userId, receiver: receiverId },
        { sender: receiverId, receiver: req.userId }
      ]
    });
    
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        // Check if the current user is the receiver of an existing request
        if (existingRequest.receiver.toString() === req.userId.toString()) {
          return sendError(
            res, 
            'This user has already sent you a friend request. You can accept it instead.', 
            'REQUEST_EXISTS',
            { requestId: existingRequest._id }
          );
        }
        return sendError(res, 'A friend request already exists', 'REQUEST_EXISTS');
      } else if (existingRequest.status === 'accepted') {
        return sendError(res, 'You are already friends with this user', 'ALREADY_FRIENDS');
      } else if (existingRequest.status === 'rejected') {
        // If there's a rejected request, we'll clear it and create a new one
        await FriendRequest.findByIdAndDelete(existingRequest._id);
      }
    }
    
    // Create new friend request
    const friendRequest = new FriendRequest({
      sender: req.userId,
      receiver: receiverId
    });
    
    await friendRequest.save();
    
    // Populate sender info to return
    await friendRequest.populate('sender', '-password');
    await friendRequest.populate('receiver', '-password');
    
    return sendSuccess(
      res, 
      'Friend request sent successfully', 
      { friendRequest }, 
      201
    );
  } catch (error) {
    console.error('Send friend request error:', error);
    
    // Handle duplicate key error (unique index violation)
    if (error.code === 11000) {
      return sendError(res, 'A friend request already exists', 'REQUEST_EXISTS');
    }
    
    return sendError(
      res, 
      'Failed to send friend request', 
      'SERVER_ERROR', 
      null, 
      500
    );
  }
});

// Get all friend requests (received)
router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.userId,
      status: 'pending'
    })
    .populate('sender', '-password')
    .sort({ createdAt: -1 }); // Show newest requests first
    
    return sendSuccess(res, 'Friend requests retrieved', { requests });
  } catch (error) {
    console.error('Get friend requests error:', error);
    return sendError(
      res, 
      'Failed to retrieve friend requests', 
      'SERVER_ERROR', 
      null, 
      500
    );
  }
});

// Get all sent friend requests
router.get('/requests/sent', auth, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.userId,
      status: 'pending'
    })
    .populate('receiver', '-password')
    .sort({ createdAt: -1 }); // Show newest requests first
    
    return sendSuccess(res, 'Sent friend requests retrieved', { requests });
  } catch (error) {
    console.error('Get sent friend requests error:', error);
    return sendError(
      res, 
      'Failed to retrieve sent friend requests', 
      'SERVER_ERROR', 
      null, 
      500
    );
  }
});

// Accept a friend request
router.put('/request/:requestId/accept', auth, validateRequestIdParams, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 'VALIDATION_ERROR', formatValidationErrors(errors));
    }

    const requestId = req.params.requestId;
    
    // Find the request
    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      return sendError(res, 'Friend request not found', 'REQUEST_NOT_FOUND', null, 404);
    }
    
    // Ensure the current user is the receiver
    if (request.receiver.toString() !== req.userId.toString()) {
      return sendError(
        res, 
        'Not authorized to accept this request', 
        'UNAUTHORIZED', 
        null, 
        403
      );
    }
    
    // Ensure request is pending
    if (request.status !== 'pending') {
      return sendError(
        res, 
        `Request already ${request.status}`, 
        'INVALID_STATUS'
      );
    }
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Update request status
      request.status = 'accepted';
      await request.save({ session });
      
      // Add each user to the other's friends list
      await User.findByIdAndUpdate(
        request.sender, 
        { $addToSet: { friends: request.receiver } },
        { session }
      );
      
      await User.findByIdAndUpdate(
        request.receiver, 
        { $addToSet: { friends: request.sender } },
        { session }
      );
      
      // Commit the transaction
      await session.commitTransaction();
      
      // Get updated sender info to return
      const sender = await User.findById(request.sender).select('-password');
      
      return sendSuccess(res, 'Friend request accepted', { friend: sender });
    } catch (txError) {
      // If anything fails, abort the transaction
      await session.abortTransaction();
      throw txError;
    } finally {
      // End the session
      session.endSession();
    }
  } catch (error) {
    console.error('Accept friend request error:', error);
    return sendError(
      res, 
      'Failed to accept friend request', 
      'SERVER_ERROR', 
      null, 
      500
    );
  }
});

// Reject a friend request
router.put('/request/:requestId/reject', auth, validateRequestIdParams, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 'VALIDATION_ERROR', formatValidationErrors(errors));
    }

    const requestId = req.params.requestId;
    
    // Find the request
    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      return sendError(res, 'Friend request not found', 'REQUEST_NOT_FOUND', null, 404);
    }
    
    // Ensure the current user is the receiver
    if (request.receiver.toString() !== req.userId.toString()) {
      return sendError(
        res, 
        'Not authorized to reject this request', 
        'UNAUTHORIZED', 
        null, 
        403
      );
    }
    
    // Ensure request is pending
    if (request.status !== 'pending') {
      return sendError(
        res, 
        `Request already ${request.status}`, 
        'INVALID_STATUS'
      );
    }
    
    // Update request status
    request.status = 'rejected';
    await request.save();
    
    return sendSuccess(res, 'Friend request rejected');
  } catch (error) {
    console.error('Reject friend request error:', error);
    return sendError(
      res, 
      'Failed to reject friend request', 
      'SERVER_ERROR', 
      null, 
      500
    );
  }
});

// Cancel a friend request (sent by the current user)
router.delete('/request/:requestId', auth, validateRequestIdParams, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 'VALIDATION_ERROR', formatValidationErrors(errors));
    }

    const requestId = req.params.requestId;
    
    // Find the request
    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      return sendError(res, 'Friend request not found', 'REQUEST_NOT_FOUND', null, 404);
    }
    
    // Ensure the current user is the sender
    if (request.sender.toString() !== req.userId.toString()) {
      return sendError(
        res, 
        'Not authorized to cancel this request', 
        'UNAUTHORIZED', 
        null, 
        403
      );
    }
    
    // Ensure request is pending
    if (request.status !== 'pending') {
      return sendError(
        res, 
        `Cannot cancel a request that is already ${request.status}`, 
        'INVALID_STATUS'
      );
    }
    
    // Delete the request
    await FriendRequest.findByIdAndDelete(requestId);
    
    return sendSuccess(res, 'Friend request cancelled');
  } catch (error) {
    console.error('Cancel friend request error:', error);
    return sendError(
      res, 
      'Failed to cancel friend request', 
      'SERVER_ERROR', 
      null, 
      500
    );
  }
});

// Get all friends
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', '-password')
      .select('friends');
    
    return sendSuccess(res, 'Friends retrieved', { friends: user.friends });
  } catch (error) {
    console.error('Get friends error:', error);
    return sendError(
      res, 
      'Failed to retrieve friends', 
      'SERVER_ERROR', 
      null, 
      500
    );
  }
});

// Get friend suggestions (users who are not friends or have pending requests)
router.get('/suggestions', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get current user's friends
    const currentUser = await User.findById(req.userId).select('friends');
    
    // Get IDs of users with pending requests (sent or received)
    const pendingRequests = await FriendRequest.find({
      $or: [
        { sender: req.userId },
        { receiver: req.userId }
      ],
      status: 'pending'
    });
    
    const pendingUserIds = pendingRequests.map(request => {
      return request.sender.toString() === req.userId.toString() 
        ? request.receiver 
        : request.sender;
    });
    
    // Combine IDs to exclude
    const excludeIds = [
      req.userId, 
      ...currentUser.friends,
      ...pendingUserIds
    ];
    
    // Find users not in the excluded list
    const suggestions = await User.find({
      _id: { $nin: excludeIds }
    })
    .select('-password')
    .limit(limit);
    
    return sendSuccess(res, 'Friend suggestions retrieved', { suggestions });
  } catch (error) {
    console.error('Get friend suggestions error:', error);
    return sendError(
      res, 
      'Failed to retrieve friend suggestions', 
      'SERVER_ERROR', 
      null, 
      500
    );
  }
});

// Check friend status with a specific user
router.get('/status/:userId', auth, validateRequestParams, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 'VALIDATION_ERROR', formatValidationErrors(errors));
    }

    const otherUserId = req.params.userId;
    
    // Check if the user exists
    const userExists = await User.findById(otherUserId);
    if (!userExists) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', null, 404);
    }
    
    // Check if they are already friends
    const currentUser = await User.findById(req.userId).select('friends');
    const areFriends = currentUser.friends.includes(otherUserId);
    
    if (areFriends) {
      return sendSuccess(res, 'Friend status checked', { 
        status: 'friends',
        user: userExists
      });
    }
    
    // Check if there's a pending request
    const request = await FriendRequest.findOne({
      $or: [
        { sender: req.userId, receiver: otherUserId },
        { sender: otherUserId, receiver: req.userId }
      ]
    });
    
    if (request) {
      const status = request.status;
      const direction = request.sender.toString() === req.userId.toString() 
        ? 'sent' 
        : 'received';
      
      return sendSuccess(res, 'Friend status checked', {
        status,
        direction,
        requestId: request._id,
        user: userExists
      });
    }
    
    // No relationship found
    return sendSuccess(res, 'Friend status checked', {
      status: 'none',
      user: userExists
    });
    
  } catch (error) {
    console.error('Check friend status error:', error);
    return sendError(
      res, 
      'Failed to check friend status', 
      'SERVER_ERROR', 
      null, 
      500
    );
  }
});

// Remove a friend
router.delete('/:friendId', auth, validateFriendIdParams, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 'VALIDATION_ERROR', formatValidationErrors(errors));
    }

    const friendId = req.params.friendId;
    
    // Verify the friend exists
    const friendExists = await User.findById(friendId);
    if (!friendExists) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', null, 404);
    }
    
    // Check if they are actually friends
    const currentUser = await User.findById(req.userId).select('friends');
    if (!currentUser.friends.includes(friendId)) {
      return sendError(res, 'This user is not in your friends list', 'NOT_FRIENDS');
    }
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Remove friend from current user's friends list
      await User.findByIdAndUpdate(
        req.userId,
        { $pull: { friends: friendId } },
        { session }
      );
      
      // Remove current user from friend's friends list
      await User.findByIdAndUpdate(
        friendId,
        { $pull: { friends: req.userId } },
        { session }
      );
      
      // Also remove any friend requests between them
      await FriendRequest.deleteMany({
        $or: [
          { sender: req.userId, receiver: friendId },
          { sender: friendId, receiver: req.userId }
        ]
      }, { session });
      
      // Commit the transaction
      await session.commitTransaction();
      
      return sendSuccess(res, 'Friend removed successfully');
    } catch (txError) {
      // If anything fails, abort the transaction
      await session.abortTransaction();
      throw txError;
    } finally {
      // End the session
      session.endSession();
    }
  } catch (error) {
    console.error('Remove friend error:', error);
    return sendError(
      res, 
      'Failed to remove friend', 
      'SERVER_ERROR', 
      null, 
      500
    );
  }
});

module.exports = router;