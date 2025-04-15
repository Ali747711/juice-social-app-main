// src/components/ChatPage/MessageList.jsx
import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import styles from './MessageList.module.css';

/**
 * MessageList - Displays the list of messages with dates and auto-scrolling
 * 
 * @param {Array} messages - Array of message objects
 * @param {Object} currentUser - Current user object
 * @param {boolean} loading - Whether messages are loading
 * @param {Function} formatTime - Function to format timestamps
 * @param {Function} shouldShowDate - Function to determine if date should be shown
 */
const MessageList = ({ messages, currentUser, loading, formatTime, shouldShowDate }) => {
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Loading messages...</p>
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className={styles.emptyStateTitle}>No messages yet</h3>
        <p className={styles.emptyStateText}>
          Start the conversation by sending a message.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.messagesContainer}>
      <div className={styles.messagesList}>
        {messages.map((message, index) => {
          const isCurrentUser = message.sender === currentUser._id;
          const showDate = shouldShowDate(message, index);
          
          return (
            <div key={message._id} className={styles.messageWrapper}>
              {showDate && (
                <div className={styles.dateHeader}>
                  <span className={styles.dateLabel}>
                    {new Date(message.createdAt).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              )}
              
              <MessageBubble 
                message={message}
                isCurrentUser={isCurrentUser}
                isRead={message.read}
                formatTime={formatTime}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;