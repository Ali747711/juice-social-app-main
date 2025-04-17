// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const Message = require('./models/Message');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const friendRoutes = require('./routes/friends');
const uploadRoutes = require('./routes/upload');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Setup Socket.IO with proper CORS for production
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.PROD_CLIENT_URL,
      process.env.DEV_CLIENT_URL
    ].filter(Boolean), // Filter out any undefined or empty values
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure CORS for the REST API
app.use(cors({
  origin: [
    process.env.PROD_CLIENT_URL,
    process.env.DEV_CLIENT_URL
  ].filter(Boolean), // Filter out any undefined or empty values
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Setup upload directory
const uploadsDir = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Upload directory created');
} else {
  console.log('Upload directory already exists');
}
console.log('Upload directory path:', uploadsDir);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/upload', uploadRoutes);
console.log('Upload route being initialized');

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Real-time messaging with Socket.IO
// This code should replace the existing Socket.IO implementation in server.js

// Socket.IO connection
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // User logs in
  socket.on('user_online', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online with socket ID: ${socket.id}`);
    
    // Inform friends that user is online
    io.emit('user_status', { userId, status: 'online' });
  });
  
  // Handle private messages
  socket.on('send_message', async (data) => {
    const { senderId, receiverId, content, files } = data;
    
    try {
      // Validate input
      if (!senderId || !receiverId) {
        return socket.emit('message_error', { 
          error: 'Missing sender or receiver ID',
          code: 'INVALID_REQUEST'
        });
      }
      
      // Validate that we have either content or files
      if (!content && (!files || files.length === 0)) {
        return socket.emit('message_error', { 
          error: 'Message must have either content or files',
          code: 'INVALID_MESSAGE'
        });
      }
      
      // Create and save message
      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        content: content || '',
        files: files || []
      });
      
      await message.save();
      
      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', {
          message,
          unread: {
            // Send updated unread count for this conversation
            conversationCount: await Message.countDocuments({
              sender: senderId,
              receiver: receiverId,
              read: false
            }),
            // Send total unread count
            totalCount: await Message.countDocuments({
              receiver: receiverId,
              read: false
            })
          }
        });
      }
      
      // Send back to sender for confirmation
      socket.emit('message_sent', message);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { 
        error: 'Failed to send message',
        code: 'SERVER_ERROR',
        details: error.message
      });
    }
  });
  
  // Handle message read status
  socket.on('mark_read', async (data) => {
    const { messageId, userId } = data;
    
    try {
      // Mark single message as read
      if (messageId) {
        const message = await Message.findOne({
          _id: messageId,
          receiver: userId,
          read: false
        });
        
        if (message) {
          message.read = true;
          message.readAt = new Date();
          await message.save();
          
          // Notify sender that message was read
          const senderSocketId = onlineUsers.get(message.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('message_read', { messageId });
          }
          
          socket.emit('read_confirmed', { messageId });
        } else {
          socket.emit('read_error', { 
            error: 'Message not found or already read',
            code: 'MESSAGE_NOT_FOUND'
          });
        }
      } 
      // Mark all messages from a specific sender as read
      else if (data.senderId) {
        const result = await Message.updateMany(
          { 
            sender: data.senderId, 
            receiver: userId, 
            read: false 
          },
          { 
            $set: { read: true, readAt: new Date() } 
          }
        );
        
        // Notify sender that messages were read
        const senderSocketId = onlineUsers.get(data.senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read', { 
            by: userId,
            count: result.modifiedCount
          });
        }
        
        socket.emit('read_confirmed', { 
          senderId: data.senderId,
          count: result.modifiedCount
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      socket.emit('read_error', { 
        error: 'Failed to mark message as read',
        code: 'SERVER_ERROR',
        details: error.message
      });
    }
  });
  
  // Join or leave a room for conversation (for better organization)
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
  });
  
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`Socket ${socket.id} left conversation: ${conversationId}`);
  });
  
  // Handle typing indicator
  socket.on('typing', (data) => {
    const { senderId, receiverId } = data;
    
    if (!senderId || !receiverId) {
      return socket.emit('error', { error: 'Missing sender or receiver ID' });
    }
    
    const receiverSocketId = onlineUsers.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { userId: senderId });
    }
  });
  
  // Handle message deletion
  socket.on('delete_message', async (data) => {
    const { messageId, userId } = data;
    
    try {
      // Find the message
      const message = await Message.findOne({
        _id: messageId,
        sender: userId
      });
      
      if (!message) {
        return socket.emit('delete_error', { 
          error: 'Message not found or you do not have permission to delete it',
          code: 'MESSAGE_NOT_FOUND'
        });
      }
      
      // Check if message is recent (less than 1 hour old)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (message.createdAt < oneHourAgo) {
        return socket.emit('delete_error', {
          error: 'Cannot delete messages older than 1 hour',
          code: 'MESSAGE_TOO_OLD'
        });
      }
      
      // Delete the message
      await message.remove();
      
      // Notify the receiver
      const receiverSocketId = onlineUsers.get(message.receiver.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message_deleted', { messageId });
      }
      
      socket.emit('delete_confirmed', { messageId });
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('delete_error', { 
        error: 'Failed to delete message',
        code: 'SERVER_ERROR',
        details: error.message
      });
    }
  });
  
  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    
    // Find and remove the disconnected user
    for (const [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(userId);
        // Inform friends that user is offline
        io.emit('user_status', { 
          userId, 
          status: 'offline',
          lastSeen: new Date()
        });
        break;
      }
    }
  });
});
// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
