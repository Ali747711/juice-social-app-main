// src/components/ChatPage/ConversationItem.jsx
import React from 'react';
import styles from './ConversationItem.module.css';

/**
 * ConversationItem - Renders a single conversation in the sidebar
 * 
 * @param {Object} conversation - Conversation object with user and message data
 * @param {string} currentUserId - Current user's ID
 * @param {boolean} isActive - Whether this conversation is the active one
 * @param {Function} formatTime - Function to format the timestamp
 * @param {Function} onSelect - Function to select this conversation
 * @param {Function} getInitials - Function to get user initials for avatar
 * @param {boolean} isOnline - Whether the user is online
 */
const ConversationItem = ({ 
  conversation, 
  currentUserId, 
  isActive,
  formatTime, 
  onSelect,
  getInitials,
  isOnline
}) => {
  const { user, lastMessage, unreadCount = 0 } = conversation;
  
  return (
    <div
      className={`${styles.conversationItem} ${isActive ? styles.active : ''}`}
      onClick={() => onSelect(user._id)}
    >
      <div className={styles.avatarWrapper}>
        {user.profilePicture ? (
          <img 
            src={user.profilePicture} 
            alt={user.fullName}
            className={styles.avatarImage}
          />
        ) : (
          <div className={styles.fallbackAvatar}>
            {getInitials(user.fullName)}
          </div>
        )}
        {isOnline && (
          <div className={styles.statusIndicator}></div>
        )}
      </div>
      
      <div className={styles.conversationInfo}>
        <div className={styles.conversationHeader}>
          <h3 className={styles.conversationName}>
            {user.fullName}
          </h3>
          {lastMessage?.createdAt && (
            <span className={styles.conversationTime}>
              {formatTime(lastMessage.createdAt)}
            </span>
          )}
        </div>
        
        <div className={styles.messagePreview}>
          {lastMessage?.sender === currentUserId ? (
            <span className={styles.youPrefix}>You: </span>
          ) : ''}
          {lastMessage?.content}
        </div>
      </div>
      
      {unreadCount > 0 && (
        <div className={styles.unreadBadge}>
          {unreadCount}
        </div>
      )}
    </div>
  );
};

export default ConversationItem;