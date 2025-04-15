// /frontend/components/ChatPage/UserInfoPanel.jsx
import React from 'react';
import AvatarDisplay from './AvatarDisplay';
import styles from './UserInfoPanel.module.css';

const UserInfoPanel = ({
  user,
  isOnline,
  isBlocked,
  isMuted = false,
  mutualFriends = 3, // Mock data
  onToggleBlock,
  onToggleMute,
  onClose,
  onViewProfile,
  onSendMessage,
  getInitials
}) => {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>User Info</h3>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className={styles.content}>
        <div className={styles.profileSection}>
          <AvatarDisplay 
            src={user.profilePicture} 
            name={user.fullName} 
            size="xlarge" 
            showStatus={true} 
            isOnline={isOnline} 
          />
          
          <h2 className={styles.fullName}>{user.fullName}</h2>
          <p className={styles.username}>@{user.username || user.fullName.toLowerCase().replace(/\s/g, '')}</p>
          
          <div className={styles.status}>
            <span className={`${styles.statusDot} ${isOnline ? styles.online : ''}`}></span>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          
          <div className={styles.details}>
            {user.lastSeen && !isOnline && (
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>🕓</span>
                <span>Last seen {user.lastSeen}</span>
              </div>
            )}
            
            {user.location && (
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>📍</span>
                <span>{user.location}</span>
              </div>
            )}
            
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>👥</span>
              <span>{mutualFriends} mutual friends</span>
            </div>
          </div>
        </div>
        
        <div className={styles.bioSection}>
          <h4 className={styles.sectionTitle}>About</h4>
          <p className={styles.bioText}>{user.bio || 'No bio available'}</p>
        </div>
        
        <div className={styles.actionButtons}>
          <button className={styles.actionButtonPrimary} onClick={onViewProfile}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            View Profile
          </button>
          
          <button className={styles.actionButtonSecondary} onClick={onSendMessage}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Send Message
          </button>
          
          <button 
            className={`${styles.actionButtonTertiary} ${isMuted ? styles.active : ''}`} 
            onClick={onToggleMute}
          >
            {isMuted ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                </svg>
                Unmute Notifications
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                Mute Notifications
              </>
            )}
          </button>
          
          <button 
            className={`${styles.actionButtonTertiary} ${isBlocked ? styles.danger : ''}`} 
            onClick={onToggleBlock}
          >
            {isBlocked ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
                Unblock User
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
                Block User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserInfoPanel;