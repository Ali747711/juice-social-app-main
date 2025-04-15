// src/components/Button.jsx
import React from 'react';
import styles from './Button.module.css'; // Fixed typo in "styles"

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...rest
}) => {
  return (
    <button
      type={type}
      className={`
        ${styles.button}
        ${styles[variant]} 
        ${styles[size]}
        ${fullWidth ? styles.fullWidth : ''}
        ${loading ? styles.loading : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? '' : children}
    </button>
  );
};

export default Button;