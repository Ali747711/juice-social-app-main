// src/components/ChatPage/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatInput.module.css';
import EmojiPicker from './EmojiPicker'; // Reusing your existing EmojiPicker component
import { FaPaperclip, FaSmile, FaPaperPlane, FaTimes, FaFile, FaImage, FaVideo } from 'react-icons/fa';

/**
 * ChatInput - Handles message input with emoji picker and attachment options
 * 
 * @param {string} messageInput - Current message input value
 * @param {Function} setMessageInput - Function to update message input
 * @param {Function} handleSendMessage - Function to send the message
 * @param {Function} handleInputChange - Function to handle input changes (for typing indicator)
 * @param {boolean} isUserBlocked - Whether the selected user is blocked
 * @param {Function} handleFileUpload - Function to handle file uploads
 */
const ChatInput = ({ 
  messageInput, 
  setMessageInput, 
  handleSendMessage, 
  handleInputChange,
  isUserBlocked,
  handleFileUpload
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Close attachment menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length > 0 || messageInput.trim()) {
      handleSendMessage(files);
      setFiles([]);
      setPreviewUrls([]);
    }
  };
  
  const handleEmojiSelect = (emoji) => {
    setMessageInput(prev => prev + emoji);
    inputRef.current?.focus();
    setShowEmojiPicker(false);
  };
  
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
    setShowAttachmentMenu(false);
  };
  
  const toggleAttachmentMenu = () => {
    setShowAttachmentMenu(prev => !prev);
    setShowEmojiPicker(false);
  };
  
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
      
      // Create preview URLs for images
      const newPreviewUrls = [...previewUrls];
      selectedFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          newPreviewUrls.push({
            url: URL.createObjectURL(file),
            type: 'image',
            name: file.name
          });
        } else if (file.type.startsWith('video/')) {
          newPreviewUrls.push({
            url: URL.createObjectURL(file),
            type: 'video',
            name: file.name
          });
        } else {
          newPreviewUrls.push({
            url: null,
            type: 'file',
            name: file.name
          });
        }
      });
      
      setPreviewUrls(newPreviewUrls);
    }
    
    setShowAttachmentMenu(false);
  };
  
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    
    // Revoke object URL to avoid memory leaks
    if (previewUrls[index].url) {
      URL.revokeObjectURL(previewUrls[index].url);
    }
    
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const triggerFileInput = (accept) => {
    fileInputRef.current.accept = accept;
    fileInputRef.current.click();
  };

  if (isUserBlocked) {
    return (
      <div className={styles.blockedMessageContainer}>
        <p className={styles.blockedMessage}>
          You have blocked this user. To send messages, please unblock them.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.inputContainer}>
      {/* File previews area */}
      {previewUrls.length > 0 && (
        <div className={styles.filePreviewsContainer}>
          {previewUrls.map((preview, index) => (
            <div key={index} className={styles.filePreview}>
              <button 
                className={styles.removeFileButton}
                onClick={() => removeFile(index)}
                aria-label="Remove file"
              >
                <FaTimes />
              </button>
              
              {preview.type === 'image' ? (
                <div className={styles.imagePreviewContainer}>
                  <img 
                    src={preview.url} 
                    alt={preview.name} 
                    className={styles.imagePreview} 
                  />
                </div>
              ) : preview.type === 'video' ? (
                <div className={styles.videoPreviewContainer}>
                  <video 
                    src={preview.url} 
                    className={styles.videoPreview} 
                    controls
                  />
                </div>
              ) : (
                <div className={styles.filePreviewIcon}>
                  <FaFile />
                  <span className={styles.fileName}>{preview.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.messageForm}>
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className={styles.hiddenFileInput}
          onChange={handleFileSelect}
          multiple
        />
        
        {/* Attachment button with dropdown menu */}
        <div className={styles.attachmentContainer} ref={attachmentMenuRef}>
          <button 
            type="button" 
            className={styles.inputAction} 
            onClick={toggleAttachmentMenu}
            aria-label="Attach file"
          >
            <FaPaperclip />
          </button>
          
          {showAttachmentMenu && (
            <div className={styles.attachmentMenu}>
              <button 
                type="button" 
                className={styles.attachmentOption}
                onClick={() => triggerFileInput('image/*')}
              >
                <FaImage className={styles.attachmentIcon} />
                <span>Photo</span>
              </button>
              
              <button 
                type="button" 
                className={styles.attachmentOption}
                onClick={() => triggerFileInput('video/*')}
              >
                <FaVideo className={styles.attachmentIcon} />
                <span>Video</span>
              </button>
              
              <button 
                type="button" 
                className={styles.attachmentOption}
                onClick={() => triggerFileInput('*/*')}
              >
                <FaFile className={styles.attachmentIcon} />
                <span>Document</span>
              </button>
            </div>
          )}
        </div>
        
        <input
          type="text"
          value={messageInput}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className={styles.messageInput}
          ref={inputRef}
        />
        
        <div className={styles.emojiPickerContainer} ref={emojiPickerRef}>
          <button 
            type="button" 
            className={styles.inputAction}
            onClick={toggleEmojiPicker}
            aria-label="Choose emoji"
          >
            <FaSmile />
          </button>
          {showEmojiPicker && (
            <div className={styles.emojiPickerWrapper}>
              <EmojiPicker 
                onSelectEmoji={handleEmojiSelect} 
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!messageInput.trim() && files.length === 0}
          className={`${styles.sendButton} ${(messageInput.trim() || files.length > 0) ? styles.active : ''}`}
          aria-label="Send message"
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;