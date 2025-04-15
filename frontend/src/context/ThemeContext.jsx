// context/ThemeContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { FaSun, FaMoon } from 'react-icons/fa';  // For theme toggle

export const ThemeContext = createContext();

// Available accent colors
const accentColors = {
  purple: {
    primary: '#5D5FEF',
    primaryHover: '#4B4DDC',
    secondary: '#A5A6F6'
  },
  pink: {
    primary: '#ec4899',
    primaryHover: '#db2777',
    secondary: '#f472b6'
  },
  green: {
    primary: '#10b981',
    primaryHover: '#059669',
    secondary: '#34d399'
  },
  blue: {
    primary: '#3b82f6', 
    primaryHover: '#2563eb',
    secondary: '#60a5fa'
  },
  orange: {
    primary: '#f97316',
    primaryHover: '#ea580c',
    secondary: '#fb923c'
  }
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [accentColor, setAccentColor] = useState('purple'); // Default accent color
  const [fontSize, setFontSize] = useState(16); // Default font size
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { currentUser, updateProfile } = useAuth();
  
  // Initialize theme preferences from user data or defaults
  useEffect(() => {
    if (currentUser) {
      // Set dark mode preference
      if (currentUser.darkMode !== undefined) {
        setDarkMode(currentUser.darkMode);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
      }
      
      // Set accent color preference
      if (currentUser.accentColor && accentColors[currentUser.accentColor]) {
        setAccentColor(currentUser.accentColor);
      }
      
      // Set font size preference
      if (currentUser.fontSize) {
        setFontSize(currentUser.fontSize);
      }
    } else {
      // Use system preference for dark mode if user not logged in
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, [currentUser]);
  
  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only change if user doesn't have a saved preference
      if (!currentUser || currentUser.darkMode === undefined) {
        setDarkMode(e.matches);
      }
    };
    
    // Add event listener with compatibility for older browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // For older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [currentUser]);
  
  // Apply dark mode to document
  useEffect(() => {
    // Add transition class for smooth theme change
    setIsTransitioning(true);
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Add transition styles temporarily
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    // Remove transition class after animation completes
    const timer = setTimeout(() => {
      setIsTransitioning(false);
      document.body.style.transition = '';
    }, 300);
    
    return () => clearTimeout(timer);
  }, [darkMode]);
  
  // Apply accent color to CSS variables
  useEffect(() => {
    if (accentColors[accentColor]) {
      const colors = accentColors[accentColor];
      document.documentElement.style.setProperty('--juice-primary', colors.primary);
      document.documentElement.style.setProperty('--juice-primary-hover', colors.primaryHover);
      document.documentElement.style.setProperty('--juice-secondary', colors.secondary);
    }
  }, [accentColor]);
  
  // Apply font size to document
  useEffect(() => {
    document.documentElement.style.setProperty('--base-font-size', `${fontSize}px`);
    // Also set the actual font size on the html element for better accessibility
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);
  
  // Toggle dark mode
  const toggleDarkMode = async (e) => {
    // Prevent the event from bubbling up if it's an event
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    // Update user preference in database if logged in
    if (currentUser && updateProfile) {
      try {
        await updateProfile({ darkMode: newMode });
      } catch (error) {
        console.error('Error updating dark mode preference:', error);
      }
    }
  };
  
  // Change accent color
  const changeAccentColor = async (color) => {
    if (accentColors[color]) {
      setAccentColor(color);
      
      // Update user preference in database if logged in
      if (currentUser && updateProfile) {
        try {
          await updateProfile({ accentColor: color });
        } catch (error) {
          console.error('Error updating accent color preference:', error);
        }
      }
    }
  };
  
  // Change font size
  const changeFontSize = async (size) => {
    const newSize = parseInt(size, 10);
    if (!isNaN(newSize) && newSize >= 12 && newSize <= 20) {
      setFontSize(newSize);
      
      // Update user preference in database if logged in
      if (currentUser && updateProfile) {
        try {
          await updateProfile({ fontSize: newSize });
        } catch (error) {
          console.error('Error updating font size preference:', error);
        }
      }
    }
  };
  
  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        toggleDarkMode,
        isTransitioning,
        accentColor,
        changeAccentColor,
        fontSize,
        changeFontSize,
        accentColors
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};