// models/Message.js
const mongoose = require('mongoose');

// File schema for attachments
const FileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'file'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  path: {
    type: String
  },
  thumbnail: {
    type: String,
    default: null
  }
}, { _id: false });

// Message schema
const MessageSchema = new mongoose.Schema({
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
  content: {
    type: String,
    default: '',
    maxlength: 5000 // Add reasonable limit to message length
  },
  read: {
    type: Boolean,
    default: false,
    index: true // Add index to improve query performance on read status
  },
  readAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  files: [FileSchema], // Array of file attachments
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent',
    index: true
  },
  deleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true }, // Include virtuals in JSON
  toObject: { virtuals: true } // Include virtuals in toObject()
});

// Ensure a message has either content or files
MessageSchema.pre('save', function(next) {
  if (!this.content && (!this.files || this.files.length === 0)) {
    next(new Error('Message must have either text content or file attachments'));
  } else {
    // Set deliveredAt when message is created
    if (this.isNew) {
      this.deliveredAt = new Date();
    }
    
    // If message is marked as read, set readAt
    if (this.isModified('read') && this.read && !this.readAt) {
      this.readAt = new Date();
      this.status = 'read';
    }
    
    next();
  }
});

// Add compound index for conversation queries
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, read: 1 }); // For unread count queries

// Add static methods for common operations
MessageSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ receiver: userId, read: false });
};

MessageSchema.statics.getUnreadCountByUser = async function(userId, otherUserId) {
  return await this.countDocuments({ 
    receiver: userId, 
    sender: otherUserId, 
    read: false 
  });
};

MessageSchema.statics.markAsRead = async function(messageId, userId) {
  const message = await this.findOne({
    _id: messageId,
    receiver: userId,
    read: false
  });
  
  if (message) {
    message.read = true;
    message.readAt = new Date();
    message.status = 'read';
    await message.save();
    return true;
  }
  
  return false;
};

MessageSchema.statics.markAllAsRead = async function(userId, senderId) {
  const result = await this.updateMany(
    { sender: senderId, receiver: userId, read: false },
    { $set: { read: true, readAt: new Date(), status: 'read' } }
  );
  
  return result.modifiedCount;
};

// Method to safely delete a message (mark as deleted)
MessageSchema.statics.softDelete = async function(messageId, userId) {
  const message = await this.findOne({
    _id: messageId,
    sender: userId,
    deleted: false
  });
  
  if (message) {
    // Check if message is recent (less than 1 hour old)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (message.createdAt < oneHourAgo) {
      return false;
    }
    
    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();
    return true;
  }
  
  return false;
};

module.exports = mongoose.model('Message', mongoose.models.Message || MessageSchema);
