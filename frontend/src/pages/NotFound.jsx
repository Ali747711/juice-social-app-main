// pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import { FaSun, FaMoon } from 'react-icons/fa';
import styles from './NotFound.module.css';

const NotFound = () => {
  const { currentUser } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <div className={styles.pageContainer}>
      <button
        onClick={toggleDarkMode}
        className={styles.themeToggleButton}
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <FaSun className={styles.sunIcon} />
        ) : (
          <FaMoon className={styles.moonIcon} />
        )}
      </button>
      
      <div className={styles.contentContainer}>
        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.errorTitle}>Page Not Found</h2>
        <p className={styles.errorMessage}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link to={currentUser ? '/' : '/login'}>
          <Button size="lg">
            Back to {currentUser ? 'Home' : 'Login'}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;