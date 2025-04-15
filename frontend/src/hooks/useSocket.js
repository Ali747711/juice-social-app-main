// hooks/useSocket.js
import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuth from './useAuth';

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { currentUser } = useAuth();
  
  // Initialize socket connection
  useEffect(() => {
    if (!currentUser) return;
    
    console.log("Initializing socket connection");
    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      query: {
        userId: currentUser._id
      }
    });
    
    setSocket(socketInstance);
    
    // Clean up socket connection on unmount
    return () => {
      console.log("Disconnecting socket");
      socketInstance.disconnect();
    };
  }, [currentUser]);
  
  // Connect events once socket is created
  useEffect(() => {
    if (!socket || !currentUser) return;
    
    console.log("Setting up socket event listeners");
    
    // Handle connection
    const handleConnect = () => {
      console.log("Socket connected");
      socket.emit('user_online', currentUser._id);
    };
    
    // Handle disconnect
    const handleDisconnect = () => {
      console.log("Socket disconnected");
    };
    
    // Handle connection error
    const handleConnectError = (error) => {
      console.error("Socket connection error:", error);
    };
    
    // Handle online users update
    const handleOnlineUsers = (users) => {
      console.log("Received online users:", users);
      setOnlineUsers(new Set(users));
    };
    
    // Handle user status change
    const handleUserStatus = ({ userId, status }) => {
      console.log(`User ${userId} is ${status}`);
      if (status === 'online') {
        setOnlineUsers(prev => new Set([...prev, userId]));
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set([...prev]);
          newSet.delete(userId);
          return newSet;
        });
      }
    };
    
    // Register event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('online_users', handleOnlineUsers);
    socket.on('user_status', handleUserStatus);
    
    // If not already connected, connect
    if (!socket.connected) {
      socket.connect();
    } else {
      // If already connected, emit user online
      socket.emit('user_online', currentUser._id);
    }
    
    // Clean up
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('online_users', handleOnlineUsers);
      socket.off('user_status', handleUserStatus);
    };
  }, [socket, currentUser]);
  
  // Send a message via socket
  const sendMessage = useCallback((receiverId, content, files = []) => {
    if (!socket || !currentUser) return;
    
    console.log("Sending message via socket:", {
      receiverId,
      contentLength: content?.length || 0,
      hasFiles: files && files.length > 0,
      fileCount: files?.length || 0
    });
    
    socket.emit('send_message', {
      senderId: currentUser._id,
      receiverId,
      content: content || '',
      files: files || []
    });
  }, [socket, currentUser]);
  
  // Send typing indicator
  const sendTypingIndicator = useCallback((receiverId) => {
    if (!socket || !currentUser) return;
    
    socket.emit('typing', {
      senderId: currentUser._id,
      receiverId
    });
  }, [socket, currentUser]);
  
  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);
  
  return {
    socket,
    sendMessage,
    sendTypingIndicator,
    isUserOnline,
    onlineUsers: Array.from(onlineUsers)
  };
};

export default useSocket;