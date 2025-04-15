// components/Layout.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import useTheme from '../hooks/useTheme';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const { darkMode } = useTheme();
  
  // Determine current page for container classes
  const getPageClass = () => {
    const path = location.pathname;
    if (path === '/') return 'home-page';
    if (path.startsWith('/chat')) return 'chat-page';
    if (path === '/friends') return 'friends-page';
    if (path === '/settings') return 'settings-page';
    return '';
  };
  
  return (
    <div className={`${styles.layout} ${darkMode ? 'dark-mode' : ''}`}>
      <Navbar />
      <main className={`${styles.content} content-wrapper ${getPageClass()} ${darkMode ? 'dark-mode' : ''}`}>
        <div className={`${styles.contentInner} content-wrapper ${darkMode ? 'dark-mode' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;