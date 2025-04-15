// components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import styles from './Navbar.module.css';
import axios from 'axios';
import { FaHome, FaCog, FaComments, FaUserFriends, FaMoon, FaSun, FaSignOutAlt } from 'react-icons/fa';
import { GiOrangeSlice } from 'react-icons/gi'; // Import an orange slice icon for the logo

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Fetch unread messages count
  useEffect(() => {
    if (currentUser) {
      const fetchUnreadCount = async () => {
        try {
          const res = await axios.get('/api/messages/unread/count');
          setUnreadCount(res.data.count);
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };
      
      fetchUnreadCount();
      
      // Poll for unread messages every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);
  
  const handleLogout = async () => {
    await logout();
  };
  
  if (!currentUser) return null;
  
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo Section - Enhanced with icon and animation */}
        <Link to="/" className={styles.logoContainer}>
          <div className={styles.logo}>
            <GiOrangeSlice className={styles.logoIcon} />
            <span className={styles.logoText}>Juice</span>
          </div>
        </Link>
        
        {/* Navigation Links - Better spacing */}
        <div className={styles.navLinks}>
          <Link
            to="/"
            className={`${styles.navLink} ${location.pathname === '/' ? styles.active : ''}`}
          >
            <FaHome className={styles.icon} />
            <span className={styles.linkText}>Home</span>
          </Link>
          
          <Link
            to="/friends"
            className={`${styles.navLink} ${location.pathname === '/friends' ? styles.active : ''}`}
          >
            <FaUserFriends className={styles.icon} />
            <span className={styles.linkText}>Friends</span>
          </Link>
          
          <Link
            to="/chat"
            className={`${styles.navLink} ${location.pathname.startsWith('/chat') ? styles.active : ''}`}
          >
            <div className={styles.badgeContainer}>
              <FaComments className={styles.icon} />
              {unreadCount > 0 && (
                <span className={styles.badge}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className={styles.linkText}>Chat</span>
          </Link>
          
          <Link
            to="/settings"
            className={`${styles.navLink} ${location.pathname === '/settings' ? styles.active : ''}`}
          >
            <FaCog className={styles.icon} />
            <span className={styles.linkText}>Settings</span>
          </Link>
        </div>
        
        {/* Right side options */}
        <div className={styles.rightSection}>
          <button
            onClick={toggleDarkMode}
            className={styles.iconButton}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <FaSun className={styles.themeIcon} />
            ) : (
              <FaMoon className={styles.themeIcon} />
            )}
          </button>
          
          <button
            onClick={handleLogout}
            className={styles.iconButton}
            title="Logout"
          >
            <FaSignOutAlt className={styles.icon} />
          </button>
          
          <Link to="/settings" className={styles.profileButton}>
            <img
              src={currentUser.profilePicture || "https://via.placeholder.com/40"}
              alt="Profile"
              className={styles.avatar}
            />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;