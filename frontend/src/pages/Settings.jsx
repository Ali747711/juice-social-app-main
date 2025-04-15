import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import Avatar from '../components/Avatar';
import AvatarManager from '../components/AvatarManager';
import { 
  FaEdit, 
  FaSignOutAlt, 
  FaCheck, 
  FaMoon, 
  FaSun, 
  FaLock, 
  FaBell, 
  FaUserShield, 
  FaUser, 
  FaPalette 
} from 'react-icons/fa';
import styles from './Settings.module.css';

const Settings = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, changePassword, logout } = useAuth();
  const { 
    darkMode, 
    toggleDarkMode, 
    accentColor, 
    changeAccentColor,
    fontSize,
    changeFontSize
  } = useTheme();
  
  // Avatar management state
  const [showAvatarManager, setShowAvatarManager] = useState(false);
  
  // Active section state
  const [activeSection, setActiveSection] = useState('account');
  
  // Account section states
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.fullName || '',
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    bio: currentUser?.bio || ''
  });
  
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password section states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Notification section states
  const [notificationSettings, setNotificationSettings] = useState({
    soundEnabled: true,
    popupEnabled: true,
    muteUnknown: false,
    dndEnabled: false,
    dndStart: '22:00',
    dndEnd: '07:00'
  });
  
  // Privacy section states
  const [privacySettings, setPrivacySettings] = useState({
    messagePermission: 'everyone',
    twoFactorEnabled: false
  });
  
  const [blockedUsers, setBlockedUsers] = useState([
    { id: '1', username: 'blockeduser1', fullName: 'Blocked User 1' },
    { id: '2', username: 'annoyingperson', fullName: 'Annoying Person' }
  ]);
  
  // Color palette options
  const colorOptions = [
    { value: 'purple', label: 'Purple', color: '#6366f1' },
    { value: 'pink', label: 'Pink', color: '#ec4899' },
    { value: 'green', label: 'Green', color: '#10b981' },
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'orange', label: 'Orange', color: '#f97316' }
  ];
  
  // Initialize notification and privacy settings from user preferences
  useEffect(() => {
    if (currentUser) {
      // Initialize notification settings if available
      if (currentUser.notificationSettings) {
        setNotificationSettings(prev => ({
          ...prev,
          ...currentUser.notificationSettings
        }));
      }
      
      // Initialize privacy settings if available
      if (currentUser.privacySettings) {
        setPrivacySettings(prev => ({
          ...prev,
          ...currentUser.privacySettings
        }));
      }
      
      // Initialize blocked users if available
      if (currentUser.blockedUsers && Array.isArray(currentUser.blockedUsers)) {
        setBlockedUsers(currentUser.blockedUsers);
      }
    }
  }, [currentUser]);

  // Handle avatar update
  const handleAvatarUpdate = (newAvatarUrl) => {
    if (updateProfile) {
      updateProfile({ profilePicture: newAvatarUrl });
    }
  };
  
  // Handle profile form change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear success message
    if (profileSuccess) {
      setProfileSuccess(false);
    }
  };
  
  // Validate profile form
  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!profileData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setProfileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submit profile form
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) return;
    
    setProfileLoading(true);
    
    const result = await updateProfile({
      fullName: profileData.fullName,
      bio: profileData.bio,
      email: profileData.email
    });
    
    setProfileLoading(false);
    
    if (result?.success) {
      setProfileSuccess(true);
    } else {
      setProfileErrors({ general: result?.error || 'Something went wrong' });
    }
  };
  
  // Handle password form change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear success message
    if (passwordSuccess) {
      setPasswordSuccess(false);
    }
  };
  
  // Validate password form
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submit password form
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setPasswordLoading(true);
    
    const result = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
    
    setPasswordLoading(false);
    
    if (result?.success) {
      setPasswordSuccess(true);
      
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      setPasswordErrors({ general: result?.error || 'Something went wrong' });
    }
  };
  
  // Handle notification settings change
  const handleNotificationChange = async (e) => {
    const { name, type, checked, value } = e.target;
    const newSettings = {
      ...notificationSettings,
      [name]: type === 'checkbox' ? checked : value
    };
    
    setNotificationSettings(newSettings);
    
    // Save to user profile
    if (updateProfile) {
      try {
        await updateProfile({ 
          notificationSettings: newSettings 
        });
      } catch (error) {
        console.error('Error updating notification settings:', error);
      }
    }
  };

  // Handle privacy settings change
  const handlePrivacyChange = async (e) => {
    const { name, type, checked, value } = e.target;
    const newSettings = {
      ...privacySettings,
      [name]: type === 'checkbox' ? checked : value
    };
    
    setPrivacySettings(newSettings);
    
    // Save to user profile
    if (updateProfile) {
      try {
        await updateProfile({ 
          privacySettings: newSettings 
        });
      } catch (error) {
        console.error('Error updating privacy settings:', error);
      }
    }
  };
  
  // Handle color change
  const handleColorChange = (value) => {
    changeAccentColor(value);
  };
  
  // Handle font size change
  const handleFontSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    changeFontSize(newSize);
  };
  
  // Remove blocked user
  const handleUnblockUser = async (userId) => {
    const updatedBlockedUsers = blockedUsers.filter(user => user.id !== userId);
    setBlockedUsers(updatedBlockedUsers);
    
    // Save to user profile
    if (updateProfile) {
      try {
        await updateProfile({ 
          blockedUsers: updatedBlockedUsers 
        });
      } catch (error) {
        console.error('Error updating blocked users:', error);
      }
    }
  };
  
  // Handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };
  
  // Safe toggle for dark mode to prevent event bubbling
  const handleDarkModeToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleDarkMode();
  };
  
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.settingsWrapper}>
          <div className={styles.settingsSidebar}>
            <div className={styles.sidebarHeader}>
              <h2 className={styles.sidebarTitle}>Settings</h2>
            </div>
            
            <div className={styles.sidebarMenu}>
              <button 
                className={`${styles.menuItem} ${activeSection === 'account' ? styles.active : ''}`}
                onClick={() => handleSectionChange('account')}
              >
                <div className={styles.menuIcon}>
                  <FaUser />
                </div>
                <span>Account Info</span>
              </button>
              
              <button 
                className={`${styles.menuItem} ${activeSection === 'appearance' ? styles.active : ''}`}
                onClick={() => handleSectionChange('appearance')}
              >
                <div className={styles.menuIcon}>
                  <FaPalette />
                </div>
                <span>Appearance</span>
              </button>
              
              <button 
                className={`${styles.menuItem} ${activeSection === 'notifications' ? styles.active : ''}`}
                onClick={() => handleSectionChange('notifications')}
              >
                <div className={styles.menuIcon}>
                  <FaBell />
                </div>
                <span>Notifications</span>
              </button>
              
              <button 
                className={`${styles.menuItem} ${activeSection === 'privacy' ? styles.active : ''}`}
                onClick={() => handleSectionChange('privacy')}
              >
                <div className={styles.menuIcon}>
                  <FaUserShield />
                </div>
                <span>Privacy & Security</span>
              </button>
              
              <button 
                className={styles.menuItem}
                onClick={logout}
              >
                <div className={styles.menuIcon}>
                  <FaSignOutAlt />
                </div>
                <span>Logout</span>
              </button>
            </div>
          </div>
          
          <div className={styles.settingsContent}>
            {/* Account Information Section */}
            {activeSection === 'account' && (
              <div className={styles.contentSection}>
                <h2 className={styles.sectionTitle}>Account Information</h2>
                
                <div className={styles.avatarSection}>
                  <Avatar 
                    user={currentUser} 
                    size="xxl" 
                    isEditable={true}
                    onEditClick={() => setShowAvatarManager(true)}
                    showStatus={false}
                  />
                  <button 
                    className={styles.changeAvatarBtn}
                    onClick={() => setShowAvatarManager(true)}
                  >
                    Change Avatar
                  </button>
                </div>
                
                {profileSuccess && (
                  <div className={styles.successMessage}>
                    <FaCheck className={styles.successIcon} />
                    Profile updated successfully!
                  </div>
                )}
                
                {profileErrors.general && (
                  <div className={styles.errorMessage}>
                    {profileErrors.general}
                  </div>
                )}
                
                <form onSubmit={handleProfileSubmit}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleProfileChange}
                      className={styles.formInput}
                      placeholder="Your full name"
                    />
                    {profileErrors.fullName && (
                      <p className={styles.errorText}>
                        {profileErrors.fullName}
                      </p>
                    )}
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Username
                    </label>
                    <div className={styles.usernameInput}>
                      <span className={styles.atSymbol}>@</span>
                      <input
                        type="text"
                        name="username"
                        value={profileData.username}
                        onChange={handleProfileChange}
                        className={styles.formInput}
                        placeholder="username"
                        disabled={true} 
                      />
                    </div>
                    <p className={styles.helpText}>Username cannot be changed</p>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className={styles.formInput}
                      placeholder="Your email address"
                    />
                    {profileErrors.email && (
                      <p className={styles.errorText}>
                        {profileErrors.email}
                      </p>
                    )}
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleProfileChange}
                      placeholder="Tell us about yourself"
                      className={styles.formTextarea}
                      rows={4}
                    />
                  </div>
                  
                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={profileLoading}
                    >
                      {profileLoading ? 'Updating...' : 'Save Changes'}
                    </button>
                    
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setProfileData({
                        fullName: currentUser?.fullName || '',
                        username: currentUser?.username || '',
                        email: currentUser?.email || '',
                        bio: currentUser?.bio || ''
                      })}
                    >
                      Discard Changes
                    </button>
                  </div>
                </form>
                
                <div className={styles.passwordSection}>
                  <h3 className={styles.subSectionTitle}>Change Password</h3>
                  
                  {passwordSuccess && (
                    <div className={styles.successMessage}>
                      <FaCheck className={styles.successIcon} />
                      Password changed successfully!
                    </div>
                  )}
                  
                  {passwordErrors.general && (
                    <div className={styles.errorMessage}>
                      {passwordErrors.general}
                    </div>
                  )}
                  
                  <form onSubmit={handlePasswordSubmit}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={styles.formInput}
                        placeholder="Enter your current password"
                      />
                      {passwordErrors.currentPassword && (
                        <p className={styles.errorText}>
                          {passwordErrors.currentPassword}
                        </p>
                      )}
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={styles.formInput}
                        placeholder="Enter new password"
                      />
                      {passwordErrors.newPassword && (
                        <p className={styles.errorText}>
                          {passwordErrors.newPassword}
                        </p>
                      )}
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={styles.formInput}
                        placeholder="Confirm new password"
                      />
                      {passwordErrors.confirmPassword && (
                        <p className={styles.errorText}>
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                    
                    <div className={styles.formActions}>
                      <button
                        type="submit"
                        className={styles.primaryButton}
                        disabled={passwordLoading}
                      >
                        {passwordLoading ? 'Changing Password...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div className={styles.contentSection}>
                <h2 className={styles.sectionTitle}>Appearance</h2>
                
                <div className={styles.preferenceItem}>
                  <div className={styles.preferenceInfo}>
                    <h3 className={styles.preferenceTitle}>
                      Dark Mode
                    </h3>
                    <p className={styles.preferenceDescription}>
                      Switch between light and dark theme
                    </p>
                  </div>
                  
                  <div className={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={handleDarkModeToggle}
                      className={styles.toggleInput}
                      id="darkModeToggle"
                    />
                    <label 
                      className={styles.toggleSlider} 
                      htmlFor="darkModeToggle"
                      aria-label="Toggle dark mode"
                      onClick={handleDarkModeToggle}
                    ></label>
                  </div>
                </div>
                
                <div className={styles.colorSection}>
                  <h3 className={styles.subSectionTitle}>Accent Color</h3>
                  <p className={styles.preferenceDescription}>
                    Choose your preferred accent color for the application
                  </p>
                  
                  <div className={styles.colorOptions}>
                    {colorOptions.map((option) => (
                      <div 
                        key={option.value} 
                        className={styles.colorOption}
                      >
                        <input
                          type="radio"
                          id={`color-${option.value}`}
                          name="accentColor"
                          value={option.value}
                          checked={accentColor === option.value}
                          onChange={() => handleColorChange(option.value)}
                          className={styles.colorInput}
                        />
                        <label 
                          htmlFor={`color-${option.value}`}
                          className={styles.colorLabel}
                          style={{ backgroundColor: option.color }}
                        >
                          {accentColor === option.value && <FaCheck className={styles.colorCheck} />}
                        </label>
                        <span className={styles.colorName}>{option.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={styles.fontSizeSection}>
                  <h3 className={styles.subSectionTitle}>Font Size</h3>
                  <p className={styles.preferenceDescription}>
                    Adjust the font size of text in the application
                  </p>
                  
                  <div className={styles.sliderContainer}>
                    <span className={styles.sliderLabel}>Small</span>
                    <input
                      type="range"
                      min="12"
                      max="20"
                      value={fontSize}
                      onChange={handleFontSizeChange}
                      className={styles.slider}
                    />
                    <span className={styles.sliderLabel}>Large</span>
                    <span className={styles.sliderValue}>{fontSize}px</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className={styles.contentSection}>
                <h2 className={styles.sectionTitle}>Notifications</h2>
                
                <div className={styles.preferenceItem}>
                  <div className={styles.preferenceInfo}>
                    <h3 className={styles.preferenceTitle}>
                      Sound Notifications
                    </h3>
                    <p className={styles.preferenceDescription}>
                      Play sound when receiving new messages
                    </p>
                  </div>
                  
                  <div className={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      name="soundEnabled"
                      checked={notificationSettings.soundEnabled}
                      onChange={handleNotificationChange}
                      className={styles.toggleInput}
                      id="soundToggle"
                    />
                    <label 
                      className={styles.toggleSlider} 
                      htmlFor="soundToggle"
                    ></label>
                  </div>
                </div>
                
                <div className={styles.preferenceItem}>
                  <div className={styles.preferenceInfo}>
                    <h3 className={styles.preferenceTitle}>
                      Popup Notifications
                    </h3>
                    <p className={styles.preferenceDescription}>
                      Show popup notification when receiving new messages
                    </p>
                  </div>
                  
                  <div className={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      name="popupEnabled"
                      checked={notificationSettings.popupEnabled}
                      onChange={handleNotificationChange}
                      className={styles.toggleInput}
                      id="popupToggle"
                    />
                    <label 
                      className={styles.toggleSlider} 
                      htmlFor="popupToggle"
                    ></label>
                  </div>
                </div>
                
                <div className={styles.preferenceItem}>
                  <div className={styles.preferenceInfo}>
                    <h3 className={styles.preferenceTitle}>
                      Mute Unknown Users
                    </h3>
                    <p className={styles.preferenceDescription}>
                      Don't receive notifications from users who are not in your contacts
                    </p>
                  </div>
                  
                  <div className={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      name="muteUnknown"
                      checked={notificationSettings.muteUnknown}
                      onChange={handleNotificationChange}
                      className={styles.toggleInput}
                      id="muteUnknownToggle"
                    />
                    <label 
                      className={styles.toggleSlider} 
                      htmlFor="muteUnknownToggle"
                    ></label>
                  </div>
                </div>
                
                <div className={styles.preferenceItem}>
                  <div className={styles.preferenceInfo}>
                    <h3 className={styles.preferenceTitle}>
                      Do Not Disturb
                    </h3>
                    <p className={styles.preferenceDescription}>
                      Automatically mute notifications during specified hours
                    </p>
                  </div>
                  
                  <div className={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      name="dndEnabled"
                      checked={notificationSettings.dndEnabled}
                      onChange={handleNotificationChange}
                      className={styles.toggleInput}
                      id="dndToggle"
                    />
                    <label 
                      className={styles.toggleSlider} 
                      htmlFor="dndToggle"
                    ></label>
                  </div>
                </div>
                
                {notificationSettings.dndEnabled && (
                  <div className={styles.timeRangeContainer}>
                    <div className={styles.timeInput}>
                      <label className={styles.formLabel}>From</label>
                      <input
                        type="time"
                        name="dndStart"
                        value={notificationSettings.dndStart}
                        onChange={handleNotificationChange}
                        className={styles.formInput}
                      />
                    </div>
                    
                    <div className={styles.timeInput}>
                      <label className={styles.formLabel}>To</label>
                      <input
                        type="time"
                        name="dndEnd"
                        value={notificationSettings.dndEnd}
                        onChange={handleNotificationChange}
                        className={styles.formInput}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Privacy & Security Section */}
            {activeSection === 'privacy' && (
              <div className={styles.contentSection}>
                <h2 className={styles.sectionTitle}>Privacy & Security</h2>
                
                <div className={styles.settingGroup}>
                  <h3 className={styles.subSectionTitle}>Messaging Permissions</h3>
                  <p className={styles.preferenceDescription}>
                    Control who can send you messages
                  </p>
                  
                  <div className={styles.radioGroup}>
                    <div className={styles.radioOption}>
                      <input
                        type="radio"
                        id="msg-everyone"
                        name="messagePermission"
                        value="everyone"
                        checked={privacySettings.messagePermission === 'everyone'}
                        onChange={handlePrivacyChange}
                        className={styles.radioInput}
                      />
                      <label htmlFor="msg-everyone" className={styles.radioLabel}>
                        Everyone
                      </label>
                    </div>
                    
                    <div className={styles.radioOption}>
                      <input
                        type="radio"
                        id="msg-contacts"
                        name="messagePermission"
                        value="contacts"
                        checked={privacySettings.messagePermission === 'contacts'}
                        onChange={handlePrivacyChange}
                        className={styles.radioInput}
                      />
                      <label htmlFor="msg-contacts" className={styles.radioLabel}>
                        Contacts only
                      </label>
                    </div>
                    
                    <div className={styles.radioOption}>
                      <input
                        type="radio"
                        id="msg-none"
                        name="messagePermission"
                        value="none"
                        checked={privacySettings.messagePermission === 'none'}
                        onChange={handlePrivacyChange}
                        className={styles.radioInput}
                      />
                      <label htmlFor="msg-none" className={styles.radioLabel}>
                        No one
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className={styles.settingGroup}>
                  <h3 className={styles.subSectionTitle}>Two-Factor Authentication</h3>
                  <p className={styles.preferenceDescription}>
                    Add an extra layer of security to your account
                  </p>
                  
                  <div className={styles.preferenceItem}>
                    <div className={styles.toggleContainer}>
                      <input
                        type="checkbox"
                        name="twoFactorEnabled"
                        checked={privacySettings.twoFactorEnabled}
                        onChange={handlePrivacyChange}
                        className={styles.toggleInput}
                        id="twoFactorToggle"
                      />
                      <label 
                        className={styles.toggleSlider} 
                        htmlFor="twoFactorToggle"
                      ></label>
                    </div>
                    
                    <div className={styles.preferenceInfo}>
                      <p className={styles.helpText}>
                        {privacySettings.twoFactorEnabled 
                          ? 'Two-factor authentication is enabled' 
                          : 'Enable two-factor authentication for additional security'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className={styles.settingGroup}>
                  <h3 className={styles.subSectionTitle}>Blocked Users</h3>
                  <p className={styles.preferenceDescription}>
                    Manage users you've blocked
                  </p>
                  
                  {blockedUsers.length > 0 ? (
                    <div className={styles.blockedList}>
                      {blockedUsers.map(user => (
                        <div key={user.id} className={styles.blockedUser}>
                          <div className={styles.blockedUserInfo}>
                            <span className={styles.blockedUserName}>{user.fullName}</span>
                            <span className={styles.blockedUserHandle}>@{user.username}</span>
                          </div>
                          <button
                            onClick={() => handleUnblockUser(user.id)}
                            className={styles.unblockButton}
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyState}>You haven't blocked any users</p>
                  )}
                </div>
                
                <div className={styles.logoutSection}>
                  <button 
                    onClick={logout}
                    className={styles.dangerButton}
                  >
                    <FaSignOutAlt className={styles.buttonIcon} />
                    Logout from all devices
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Avatar Manager Modal */}
      {showAvatarManager && (
        <AvatarManager 
          onClose={() => setShowAvatarManager(false)} 
          onAvatarUpdate={handleAvatarUpdate}
        />
      )}
    </Layout>
  );
};

export default Settings;