import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import Avatar from '../components/Avatar';
import AvatarManager from '../components/AvatarManager';
import { FaEdit, FaSignOutAlt, FaCheck, FaMoon, FaSun, FaLock } from 'react-icons/fa';
import styles from './Profile.module.css';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, changePassword, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // Avatar management state
  const [showAvatarManager, setShowAvatarManager] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.fullName || '',
    bio: currentUser?.bio || ''
  });
  
  // Profile update states
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Password update states
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Active section state
  const [activeSection, setActiveSection] = useState('personal');
  
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
  
  // Validate profile form
  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!profileData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    setProfileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
  
  // Submit profile form
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) return;
    
    setProfileLoading(true);
    
    const result = await updateProfile({
      fullName: profileData.fullName,
      bio: profileData.bio
    });
    
    setProfileLoading(false);
    
    if (result.success) {
      setProfileSuccess(true);
    } else {
      setProfileErrors({ general: result.error });
    }
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
    
    if (result.success) {
      setPasswordSuccess(true);
      
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      setPasswordErrors({ general: result.error });
    }
  };
  
  // Function to handle avatar update
  const handleAvatarUpdate = (newAvatarUrl) => {
    // This will be called when the avatar is updated
    if (updateProfile) {
      updateProfile({ profilePicture: newAvatarUrl });
    }
  };
  
  // Change active section
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };
  
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.profileWrapper}>
          <div className={styles.profileSidebar}>
            <div className={styles.profileHeader}>
              <div className={styles.avatarContainer}>
                <Avatar 
                  user={currentUser} 
                  size="xxl" 
                  isEditable={true}
                  onEditClick={() => setShowAvatarManager(true)}
                  showStatus={false}
                />
              </div>
              <div className={styles.userInfo}>
                <h2 className={styles.userName}>{currentUser?.fullName}</h2>
                <p className={styles.userHandle}>@{currentUser?.username}</p>
              </div>
            </div>
            
            <div className={styles.sidebarMenu}>
              <button 
                className={`${styles.menuItem} ${activeSection === 'personal' ? styles.active : ''}`}
                onClick={() => handleSectionChange('personal')}
              >
                <div className={styles.menuIcon}>
                  <FaEdit />
                </div>
                <span>Personal Information</span>
              </button>
              
              <button 
                className={`${styles.menuItem} ${activeSection === 'security' ? styles.active : ''}`}
                onClick={() => handleSectionChange('security')}
              >
                <div className={styles.menuIcon}>
                  <FaLock />
                </div>
                <span>Login & Password</span>
              </button>
              
              <button 
                className={`${styles.menuItem} ${activeSection === 'preferences' ? styles.active : ''}`}
                onClick={() => handleSectionChange('preferences')}
              >
                <div className={styles.menuIcon}>
                  {darkMode ? <FaMoon /> : <FaSun />}
                </div>
                <span>Preferences</span>
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
          
          <div className={styles.profileContent}>
            {activeSection === 'personal' && (
              <div className={styles.contentSection}>
                <h2 className={styles.sectionTitle}>Personal Information</h2>
                
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
                        bio: currentUser?.bio || ''
                      })}
                    >
                      Discard Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {activeSection === 'security' && (
              <div className={styles.contentSection}>
                <h2 className={styles.sectionTitle}>Login & Password</h2>
                
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
            )}
            
            {activeSection === 'preferences' && (
              <div className={styles.contentSection}>
                <h2 className={styles.sectionTitle}>Preferences</h2>
                
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
                      onChange={toggleDarkMode}
                      className={styles.toggleInput}
                      id="darkModeToggle"
                    />
                    <label 
                      className={styles.toggleSlider} 
                      htmlFor="darkModeToggle"
                      aria-label="Toggle dark mode"
                    ></label>
                  </div>
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

export default Profile;