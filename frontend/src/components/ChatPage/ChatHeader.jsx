// components/ChatPage/ChatHeader.jsx
import React from 'react';
import styles from './ChatHeader.module.css';

/**
 * Enhanced ChatHeader component with improved avatar and status indicators
 * 
 * @param {Object} selectedUser - The user object for the current conversation
 * @param {Function} toggleUserInfo - Function to toggle user info panel
 * @param {Function} navigateBack - Function to navigate back on mobile
 * @param {boolean} isOnline - Whether the selected user is online
 * @param {boolean} isTyping - Whether the selected user is typing
 * @param {Function} getInitials - Function to get user initials for avatar
 */
const ChatHeader = ({ 
  selectedUser, 
  toggleUserInfo, 
  navigateBack, 
  isOnline, 
  isTyping,
  getInitials 
}) => {
  if (!selectedUser) return null;
  
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <button
          className={styles.backButton}
          onClick={navigateBack}
          aria-label="Back to conversations"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        
        <div className={styles.userInfo}>
          <div className={styles.avatarContainer}>
            {selectedUser.profilePicture ? (
              <img
                src={selectedUser.profilePicture}
                alt={selectedUser.fullName}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.fallbackAvatar}>
                {getInitials(selectedUser.fullName)}
              </div>
            )}
            <div className={`${styles.statusDot} ${isOnline ? styles.online : ''}`}></div>
          </div>
          
          <div className={styles.userDetails}>
            <h2 className={styles.userName}>{selectedUser.fullName}</h2>
            {isTyping ? (
              <div className={styles.typingIndicator}>
                <span className={styles.typingText}>typing</span>
                <span className={styles.typingDot}></span>
                <span className={styles.typingDot}></span>
                <span className={styles.typingDot}></span>
              </div>
            ) : (
              <span className={styles.userStatus}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.headerActions}>
        <button 
          className={styles.infoButton}
          onClick={toggleUserInfo}
          aria-label="View user info"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;