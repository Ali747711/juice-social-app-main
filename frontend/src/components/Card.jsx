// components/Card.jsx
import React from 'react';
import styles from './Card.module.css';

const Card = ({ 
  children, 
  className = '', 
  padding = true,
  hover = false,
  onClick
}) => {
  return (
    <div 
      className={`
        ${styles.card}
        ${padding ? styles.withPadding : ''}
        ${hover ? styles.hover : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;