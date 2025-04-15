// utils/verifyTheme.js
// Use this to check if theme styling is properly applied to all components

/**
 * Logs theme-related issues to help debug styling problems
 * Call this function from your browser console or add it to a component for testing
 */
export const verifyThemeImplementation = () => {
    console.log("🧃 Juice Theme Verification Tool");
    console.log("-------------------------------");
    
    // 1. Check CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--juice-primary').trim();
    const darkMode = document.body.getAttribute('data-theme') === 'dark';
    
    console.log("📊 CSS Variables:");
    console.log("Primary Color:", primaryColor);
    console.log("Dark Mode:", darkMode);
    
    // 2. Check class applications
    const contentWrappers = document.querySelectorAll('.content-wrapper');
    console.log(`📦 Content Wrappers Found: ${contentWrappers.length}`);
    
    if (contentWrappers.length === 0) {
      console.warn("⚠️ No content-wrapper classes found. Dark mode may not apply properly.");
    }
    
    // 3. Check accent color application
    const accentElements = document.querySelectorAll('.juice-primary-text, .juice-primary-bg');
    console.log(`🎨 Accent Color Elements Found: ${accentElements.length}`);
    
    // 4. Check for elements that might need class additions
    const potentialStylingIssues = [];
    
    // Cards without juice-card class
    const cards = document.querySelectorAll('.card:not(.juice-card)');
    if (cards.length > 0) {
      potentialStylingIssues.push({
        issue: "Cards without juice-card class",
        count: cards.length,
        fix: "Add juice-card class to these elements"
      });
    }
    
    // Buttons without proper classes
    const buttons = document.querySelectorAll('button:not(.btn):not(.btn-primary):not(.btn-secondary)');
    if (buttons.length > 0) {
      potentialStylingIssues.push({
        issue: "Buttons without theme classes",
        count: buttons.length,
        fix: "Add btn, btn-primary, or btn-secondary classes"
      });
    }
    
    // Report issues
    if (potentialStylingIssues.length > 0) {
      console.warn("⚠️ Potential Theme Styling Issues:");
      potentialStylingIssues.forEach(issue => {
        console.warn(`- ${issue.issue} (${issue.count} items)`);
        console.warn(`  Fix: ${issue.fix}`);
      });
    } else {
      console.log("✅ No obvious theme styling issues detected");
    }
    
    console.log("-------------------------------");
    console.log("Theme verification complete!");
  };
  
  // Call this function to add missing classes to elements
  export const fixThemeStyling = () => {
    // 1. Add content-wrapper to main containers
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
    
    let fixCount = 0;
    
    containers.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el.classList.contains('content-wrapper')) {
          el.classList.add('content-wrapper');
          fixCount++;
        }
      });
    });
    
    // 2. Add juice-card class to cards
    const cards = document.querySelectorAll('.card:not(.juice-card)');
    cards.forEach(card => {
      card.classList.add('juice-card');
      fixCount++;
    });
    
    // 3. Add color classes to elements
    const colorElements = {
      '.navbar .logo': 'juice-primary-text',
      '.active': 'juice-primary-text',
      '.nav-link.active .icon': 'juice-primary-text',
      '.badge': 'juice-primary-text',
      '.btn-primary': 'juice-primary-bg',
      '.message-bubble-own': 'juice-primary-bg'
    };
    
    Object.entries(colorElements).forEach(([selector, className]) => {
      const elements = document.querySelectorAll(`${selector}:not(.${className})`);
      elements.forEach(el => {
        el.classList.add(className);
        fixCount++;
      });
    });
    
    console.log(`🛠️ Fixed ${fixCount} theme styling issues`);
    return fixCount;
  };
  
  // Export utility function for direct element checks
  export const hasProperThemingStyling = (element) => {
    if (!element) return false;
    
    const needsContentWrapper = 
      element.classList.contains('page-container') ||
      element.classList.contains('card') ||
      element.classList.contains('settings-content');
    
    if (needsContentWrapper && !element.classList.contains('content-wrapper')) {
      return false;
    }
    
    // Check card styling
    if (element.classList.contains('card') && !element.classList.contains('juice-card')) {
      return false;
    }
    
    return true;
  };