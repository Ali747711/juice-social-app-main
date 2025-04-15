// context/SocketContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';

export const SocketContext = createContext();

// Use environment variable for the API URL, with fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const { currentUser } = useAuth();
  
  useEffect(() => {
    if (!currentUser) {
      // If user is not logged in, disconnect socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }
    
    console.log(`Connecting to socket server at: ${API_BASE_URL}`);
    
    // Initialize socket connection with the environment variable
    const newSocket = io(API_BASE_URL, {
      withCredentials: true,
    });
    
    setSocket(newSocket);
    
    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      // Emit user online event
      newSocket.emit('user_online', currentUser._id);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    newSocket.on('user_status', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        if (status === 'online') {
          newMap.set(userId, true);
        } else {
          newMap.set(userId, false);
        }
        return newMap;
      });
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
    
    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);
  
  // Check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers.get(userId) || false;
  };
  
  // Send a message via socket
  const sendMessage = (receiverId, content) => {
    if (socket && currentUser) {
      socket.emit('send_message', {
        senderId: currentUser._id,
        receiverId,
        content
      });
    }
  };
  
  // Send typing indicator
  const sendTypingIndicator = (receiverId) => {
    if (socket && currentUser) {
      socket.emit('typing', {
        senderId: currentUser._id,
        receiverId
      });
    }
  };
  
  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        isUserOnline,
        sendMessage,
        sendTypingIndicator
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
