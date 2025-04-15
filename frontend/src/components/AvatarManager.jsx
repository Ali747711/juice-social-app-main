// components/AvatarManager.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import styles from './AvatarManager.module.css';
import { FaCamera, FaTrash, FaTimes, FaCheck } from 'react-icons/fa';
import useAuth from '../hooks/useAuth';

const AvatarManager = ({ onClose, onAvatarUpdate }) => {
  const { currentUser } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  // Trigger file input click
  const handleSelectImage = () => {
    fileInputRef.current.click();
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    // Reset error
    setError(null);
    
    // Set selected file
    setSelectedImage(file);
    
    // Create preview URL
    const imageUrl = URL.createObjectURL(file);
    setPreviewUrl(imageUrl);
  };
  
  // Upload avatar
  const handleUpload = async () => {
    if (!selectedImage) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('avatar', selectedImage);
      
      const response = await axios.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update user with new avatar URL
      if (response.data.success) {
        onAvatarUpdate(response.data.profilePicture);
        onClose();
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete avatar
  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.delete('/api/users/avatar');
      
      if (response.data.success) {
        onAvatarUpdate(null);
        onClose();
      }
    } catch (error) {
      console.error('Error deleting avatar:', error);
      setError(error.response?.data?.message || 'Failed to delete avatar');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel upload
  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setSelectedImage(null);
    setPreviewUrl(null);
    setError(null);
    
    onClose();
  };
  
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Profile Picture</h2>
          <button 
            className={styles.closeButton} 
            onClick={handleCancel}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.avatarPreview}>
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className={styles.previewImage} 
              />
            ) : currentUser?.profilePicture ? (
              <img 
                src={currentUser.profilePicture} 
                alt={currentUser.fullName} 
                className={styles.currentAvatar} 
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {currentUser?.fullName ? (
                  currentUser.fullName
                    .split(' ')
                    .map(part => part[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2)
                ) : '?'}
              </div>
            )}
          </div>
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <div className={styles.actionButtons}>
            {!selectedImage && (
              <>
                <button 
                  className={styles.uploadButton}
                  onClick={handleSelectImage}
                  disabled={isLoading}
                >
                  <FaCamera />
                  Choose Photo
                </button>
                
                {currentUser?.profilePicture && (
                  <button 
                    className={styles.deleteButton}
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    <FaTrash />
                    Remove
                  </button>
                )}
              </>
            )}
            
            {selectedImage && (
              <>
                <button 
                  className={styles.confirmButton}
                  onClick={handleUpload}
                  disabled={isLoading}
                >
                  <FaCheck />
                  {isLoading ? 'Uploading...' : 'Save'}
                </button>
                
                <button 
                  className={styles.cancelButton}
                  onClick={() => {
                    URL.revokeObjectURL(previewUrl);
                    setSelectedImage(null);
                    setPreviewUrl(null);
                  }}
                  disabled={isLoading}
                >
                  <FaTimes />
                  Cancel
                </button>
              </>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className={styles.hiddenInput}
          />
        </div>
      </div>
    </div>
  );
};

export default AvatarManager;