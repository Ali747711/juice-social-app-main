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
  }
}, { _id: false });

// Message schema
const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  files: [FileSchema], // Array of file attachments
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a message has either content or files
MessageSchema.pre('save', function(next) {
  if (!this.content && (!this.files || this.files.length === 0)) {
    next(new Error('Message must have either text content or file attachments'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Message', mongoose.models.Message || MessageSchema);