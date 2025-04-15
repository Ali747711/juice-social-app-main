// components/FriendCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import styles from './FriendCard.module.css';

const FriendCard = ({ user, lastMessage, timestamp, showMessage = false }) => {
  return (
    <Link to={`/chat/${user._id}`} className={styles.cardContainer}>
      <div className={styles.avatarSection}>
        <Avatar user={user} size="md" showStatus={true} />
      </div>
      
      <div className={styles.infoSection}>
        <div className={styles.nameRow}>
          <h4 className={styles.userName}>{user.fullName}</h4>
          {timestamp && (
            <span className={styles.timestamp}>
              {typeof timestamp === 'string' ? timestamp : `${timestamp} Apr`}
            </span>
          )}
        </div>
        
        {showMessage && lastMessage && (
          <p className={styles.preview}>
            {lastMessage.length > 30 
              ? `${lastMessage.substring(0, 30)}...` 
              : lastMessage
            }
          </p>
        )}
      </div>
    </Link>
  );
};

export default FriendCard;