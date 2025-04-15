// components/Avatar.jsx
import React from 'react';
import OnlineIndicator from './OnlineIndicator';
import styles from './Avatar.module.css';

const Avatar = ({ 
  user,
  size = 'md',
  showStatus = true, 
  className = '',
  isEditable = false,
  onEditClick = () => {},
}) => {
  // Get user initials for fallback
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const initials = user?.fullName ? getInitials(user.fullName) : '?';
  
  return (
    <div className={`${styles.avatarContainer} ${className}`}>
      {/* User has profile picture */}
      {user?.profilePicture ? (
        <img
          src={user.profilePicture}
          alt={user?.fullName || 'User'}
          className={`${styles.avatar} ${styles[size]} ${styles.border}`}
        />
      ) : (
        /* Fallback to initials avatar if no profile picture */
        <div className={`${styles.avatar} ${styles[size]} ${styles.initialsAvatar} ${styles.border}`}>
          {initials}
        </div>
      )}
      
      {/* Edit button */}
      {isEditable && (
        <button 
          className={styles.editButton}
          onClick={onEditClick}
          aria-label="Edit profile picture"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </button>
      )}
      
      {/* Online status indicator */}
      {showStatus && user?._id && (
        <OnlineIndicator 
          userId={user._id} 
          className={styles.statusIndicator}
        />
      )}
    </div>
  );
};

export default Avatar;