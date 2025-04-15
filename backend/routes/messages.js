// routes/messages.js
const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// Get conversation with a specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    
    // Find messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: otherUserId },
        { sender: otherUserId, receiver: req.userId }
      ]
    }).sort('createdAt');
    
    // Mark messages as read
    await Message.updateMany(
      { sender: otherUserId, receiver: req.userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
            { sender: req.userId },
            { receiver: req.userId }
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
              { $eq: ['$sender', req.userId] },
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
            receiver: 1
          },
          unreadCount: {
            $cond: [
              {
                $and: [
                  { $eq: ['$lastMessage.receiver', req.userId] },
                  { $eq: ['$lastMessage.read', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      },
      // Sort by last message date
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);
    
    res.status(200).json({ conversations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread messages count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.userId,
      read: false
    });
    
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message (REST API version as fallback for Socket.IO)
router.post('/:userId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const receiverId = req.params.userId;
    
    // Create new message
    const message = new Message({
      sender: req.userId,
      receiver: receiverId,
      content
    });
    
    await message.save();
    
    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;