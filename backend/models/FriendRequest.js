// models/FriendRequest.js
const mongoose = require('mongoose');

/**
 * Friend Request Schema
 * Represents a friend request between two users
 */
const FriendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
    index: true
  },
  message: {
    type: String,
    maxlength: 200,
    default: ''
  },
  seenAt: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true,
  // Add virtual getters to JSON output
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure sender and receiver are different
FriendRequestSchema.pre('save', function(next) {
  if (this.sender.toString() === this.receiver.toString()) {
    return next(new Error('Sender and receiver cannot be the same'));
  }
  next();
});

// Ensure no duplicate requests
FriendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Add virtual property to check if request is seen
FriendRequestSchema.virtual('isSeen').get(function() {
  return this.seenAt !== null;
});

// Add static method to mark request as seen
FriendRequestSchema.statics.markAsSeen = async function(requestId, userId) {
  const request = await this.findOne({
    _id: requestId,
    receiver: userId,
    seenAt: null
  });
  
  if (request) {
    request.seenAt = new Date();
    await request.save();
    return true;
  }
  
  return false;
};

// Add static method to get unread count
FriendRequestSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    receiver: userId,
    status: 'pending',
    seenAt: null
  });
};

// Add helper method to check if a request exists between users
FriendRequestSchema.statics.checkRequestExists = async function(user1Id, user2Id) {
  const request = await this.findOne({
    $or: [
      { sender: user1Id, receiver: user2Id },
      { sender: user2Id, receiver: user1Id }
    ]
  });
  
  return request;
};

module.exports = mongoose.model('FriendRequest', FriendRequestSchema);