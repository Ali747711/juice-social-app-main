import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';
import styles from './UserInfoPanel.module.css';

const UserInfoPanel = ({ user, isBlocked, onToggleBlock, onClose, isOnline }) => {
  const navigate = useNavigate();

  // Get initials for fallback avatar
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={styles.userInfoPanel}>
      <div className={styles.userInfoHeader}>
        <h3 className={styles.userInfoTitle}>User Info</h3>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close user info"
        >
          <FaChevronRight />
        </button>
      </div>
      
      <div className={styles.userInfoContent}>
        <div className={styles.userInfoProfile}>
          <div className={styles.profileAvatarContainer}>
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.fullName}
                className={styles.profileImage}
              />
            ) : (
              <div className={styles.profileFallbackAvatar}>
                {getInitials(user.fullName)}
              </div>
            )}
          </div>
          
          <h2 className={styles.profileName}>{user.fullName}</h2>
          <p className={styles.profileUsername}>@{user.username || 'username'}</p>
          
          <div className={styles.profileStatus}>
            <span className={`${styles.statusIndicator} ${isOnline ? styles.online : ''}`}></span>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        
        <div className={styles.userInfoSection}>
          <h4 className={styles.sectionTitle}>About</h4>
          <p className={styles.sectionContent}>
            {user.bio || 'No bio available'}
          </p>
        </div>
        
        <div className={styles.userActions}>
          <button 
            className={styles.viewProfileButton}
            onClick={() => navigate(`/profile/${user.username || user._id}`)}
          >
            View Profile
          </button>
          
          <button 
            onClick={onToggleBlock}
            className={isBlocked ? styles.blockedButton : styles.blockButton}
          >
            {isBlocked ? 'Blocked' : 'Block User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserInfoPanel;