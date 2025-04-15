// utils/themeHelper.js

/**
 * Adds the necessary wrapper classes to components for proper theme handling
 * Call this function when your app initializes
 */
export const initializeThemeClasses = () => {
  // Find main containers
  const appRoot = document.getElementById('root');
  if (appRoot) {
    appRoot.classList.add('app-container');
  }
  
  // Add content-wrapper class to main content containers
  const containers = [
    '.page-container',
    '.card',
    '.navbar',
    '.sidebar',
    '.settings-content',
    '.chat-sidebar',
    '.chat-content',
    '.message-list',
    '.settings-wrapper',
    '.friends-container'
  ];
  
  containers.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.classList.add('content-wrapper');
    });
  });
  
  // Add juice-card class to cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.classList.add('juice-card');
  });
  
  // Add primary-color class to elements that should use the accent color
  const primaryElements = [
    '.navbar .logo',
    '.navbar .active',
    '.nav-link.active .icon',
    '.badge'
  ];
  
  primaryElements.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.classList.add('juice-primary-text');
    });
  });
  
  // Add primary-bg class to elements with accent color background
  const primaryBgElements = [
    '.btn-primary',
    '.message-bubble-own',
    '.send-button',
    '.action-button'
  ];
  
  primaryBgElements.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.classList.add('juice-primary-bg');
    });
  });
};

/**
 * Apply accent color to specific elements that might not inherit from CSS variables
 * @param {string} color - The selected accent color (e.g., 'purple', 'pink')
 * @param {Object} colorValues - The color values for the accent color
 */
export const applyAccentColor = (color, colorValues) => {
  // Direct style application for elements that might not inherit CSS variables
  const accentElements = document.querySelectorAll(
    '.btn-primary, .navbar .icon, .logo, .active, .message-bubble-own, ' + 
    '.menu-item.active, .nav-link.active .icon, .badge, ' +
    '.friend-actions button, .message-button, .user-actions button'
  );
  
  accentElements.forEach(element => {
    if (element.classList.contains('btn-primary') || 
        element.classList.contains('message-button') ||
        element.classList.contains('user-actions')) {
      element.style.backgroundColor = colorValues.primary;
    } else if (element.classList.contains('active') || 
              element.classList.contains('icon') ||
              element.classList.contains('badge')) {
      element.style.color = colorValues.primary;
    }
  });
};