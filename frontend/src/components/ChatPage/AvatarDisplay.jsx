// /frontend/components/ChatPage/AvatarDisplay.jsx
import React from 'react';
import styles from './AvatarDisplay.module.css';

const AvatarDisplay = ({ src, name, size = 'medium', showStatus = false, isOnline = false }) => {
  // Get initials for fallback
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Determine size class
  const sizeClass = {
    small: styles.avatarSmall, // 32px
    medium: styles.avatarMedium, // 48px
    large: styles.avatarLarge, // 80px
    xlarge: styles.avatarXlarge // 120px
  }[size] || styles.avatarMedium;
  
  return (
    <div className={`${styles.avatarContainer} ${sizeClass}`}>
      {src ? (
        <img 
          src={src} 
          alt={name || 'User'} 
          className={styles.avatarImage}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : (
        <div className={styles.avatarFallback}>
          {getInitials(name)}
        </div>
      )}
      
      {showStatus && (
        <div className={`${styles.statusIndicator} ${isOnline ? styles.online : styles.offline}`}></div>
      )}
    </div>
  );
};

export default AvatarDisplay;