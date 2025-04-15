// components/EmptyState.jsx
import React from 'react';
import { FaInbox, FaSearch, FaUserFriends, FaComment } from 'react-icons/fa';
import styles from './EmptyState.module.css';

const EmptyState = ({ 
  type = 'generic', 
  title = 'Nothing to show', 
  message = 'There is no data to display at the moment.',
  actionText,
  onAction
}) => {
  // Define icon based on type
  let Icon;
  switch (type) {
    case 'messages':
      Icon = FaInbox;
      break;
    case 'search':
      Icon = FaSearch;
      break;
    case 'friends':
      Icon = FaUserFriends;
      break;
    case 'chat':
      Icon = FaComment;
      break;
    default:
      Icon = FaInbox;
  }
  
  return (
    <div className={`${styles.container} ${styles[type]}`}>
      <div className={styles.iconContainer}>
        <Icon className={styles.icon} />
      </div>
      <h3 className={styles.title}>
        {title}
      </h3>
      <p className={styles.message}>
        {message}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className={styles.action}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;