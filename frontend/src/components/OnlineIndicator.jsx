// components/OnlineIndicator.jsx
import React from 'react';
import useSocket from '../hooks/useSocket';
import styles from './OnlineIndicator.module.css';

const OnlineIndicator = ({ userId, className = '' }) => {
  const { isUserOnline } = useSocket();
  const online = isUserOnline(userId);
  
  return (
    <div 
      className={`
        ${styles.indicator} 
        ${online ? styles.online : styles.offline} 
        ${className}
      `}
    />
  );
};

export default OnlineIndicator;