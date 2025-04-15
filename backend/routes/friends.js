// routes/friends.js
const express = require('express');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Send friend request
router.post('/request/:userId', auth, async (req, res) => {
  try {
    const receiverId = req.params.userId;
    
    // Check if receiver exists
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if sender is trying to add themselves
    if (req.userId.toString() === receiverId) {
      return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
    }
    
    // Check if they are already friends
    if (req.user.friends.includes(receiverId)) {
      return res.status(400).json({ message: 'You are already friends with this user' });
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
        return res.status(400).json({ message: 'A friend request already exists' });
      } else if (existingRequest.status === 'accepted') {
        return res.status(400).json({ message: 'You are already friends with this user' });
      }
    }
    
    // Create new friend request
    const friendRequest = new FriendRequest({
      sender: req.userId,
      receiver: receiverId
    });
    
    await friendRequest.save();
    
    res.status(201).json({
      message: 'Friend request sent successfully',
      friendRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all friend requests (received)
router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.userId,
      status: 'pending'
    }).populate('sender', '-password');
    
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all sent friend requests
router.get('/requests/sent', auth, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.userId,
      status: 'pending'
    }).populate('receiver', '-password');
    
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept a friend request
router.put('/request/:requestId/accept', auth, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    
    // Find the request
    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Ensure the current user is the receiver
    if (request.receiver.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }
    
    // Ensure request is pending
    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request already ${request.status}` });
    }
    
    // Update request status
    request.status = 'accepted';
    await request.save();
    
    // Add each user to the other's friends list
    await User.findByIdAndUpdate(request.sender, {
      $addToSet: { friends: request.receiver }
    });
    
    await User.findByIdAndUpdate(request.receiver, {
      $addToSet: { friends: request.sender }
    });
    
    res.status(200).json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject a friend request
router.put('/request/:requestId/reject', auth, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    
    // Find the request
    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Ensure the current user is the receiver
    if (request.receiver.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }
    
    // Ensure request is pending
    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request already ${request.status}` });
    }
    
    // Update request status
    request.status = 'rejected';
    await request.save();
    
    res.status(200).json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all friends
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends', '-password');
    
    res.status(200).json({ friends: user.friends });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove a friend
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const friendId = req.params.friendId;
    
    // Remove friend from current user's friends list
    await User.findByIdAndUpdate(req.userId, {
      $pull: { friends: friendId }
    });
    
    // Remove current user from friend's friends list
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: req.userId }
    });
    
    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;