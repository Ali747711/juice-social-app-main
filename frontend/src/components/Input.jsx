// components/Input.jsx
import React, { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(({
  label,
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  error,
  fullWidth = true,
  className = '',
  ...rest
}, ref) => {
  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ''}`}>
      {label && (
        <label 
          htmlFor={id || name} 
          className={styles.label}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          ${styles.input}
          ${error ? styles.error : ''}
          ${className}
        `}
        {...rest}
      />
      {error && (
        <p className={styles.errorMessage}>{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;