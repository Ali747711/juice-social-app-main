// src/components/ChatPage/MessageBubble.jsx
import React, { useState } from 'react';
import styles from './MessageBubble.module.css';
import { FaFile, FaDownload, FaTimes } from 'react-icons/fa';

/**
 * MessageBubble - Displays a single message with support for text and file attachments
 * 
 * @param {Object} message - The message object to display
 * @param {boolean} isCurrentUser - Whether the message is from the current user
 * @param {Function} formatTime - Function to format the message timestamp
 */
const MessageBubble = ({ message, isCurrentUser, formatTime }) => {
  const [expandedImage, setExpandedImage] = useState(null);
  
  const getFileSize = (size) => {
    // Convert bytes to KB or MB for display
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  // Handle image click to expand
  const handleImageClick = (url) => {
    setExpandedImage(url);
  };
  
  // Close expanded image
  const closeExpandedImage = () => {
    setExpandedImage(null);
  };
  
  return (
    <div 
      className={`${styles.messageBubble} ${isCurrentUser ? styles.sent : styles.received}`}
      data-testid="message-bubble"
    >
      <div className={styles.messageContent}>
        {/* File attachments section */}
        {message.files && message.files.length > 0 && (
          <div className={styles.attachmentsContainer}>
            {message.files.map((file, index) => (
              <div key={index} className={styles.attachment}>
                {file.type === 'image' ? (
                  <div className={styles.imageAttachment}>
                    <img 
                      src={message.filePreviewUrls?.[index]?.url || file.url} 
                      alt={file.name} 
                      className={styles.attachmentImage} 
                      loading="lazy"
                      onClick={() => handleImageClick(file.url)}
                    />
                  </div>
                ) : file.type === 'video' ? (
                  <div className={styles.videoAttachment}>
                    <video 
                      src={message.filePreviewUrls?.[index]?.url || file.url} 
                      controls
                      className={styles.attachmentVideo}
                    />
                  </div>
                ) : (
                  <div className={styles.fileAttachment}>
                    <div className={styles.fileIcon}>
                      <FaFile />
                    </div>
                    <div className={styles.fileDetails}>
                      <span className={styles.fileName}>{file.name}</span>
                      <span className={styles.fileSize}>{getFileSize(file.size)}</span>
                    </div>
                    <a 
                      href={file.url}
                      download={file.name}
                      className={styles.downloadButton}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaDownload />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Message text content */}
        {message.content && (
          <p className={styles.messageText}>{message.content}</p>
        )}
        
        {/* Message timestamp */}
        <div className={styles.messageInfo}>
          <span className={styles.messageTime}>
            {formatTime(message.createdAt)}
          </span>
          
          {/* Read status indicator (for sent messages) */}
          {isCurrentUser && (
            <span className={`${styles.readStatus} ${message.read ? styles.read : ''}`}>
              {message.read ? 'Read' : 'Sent'}
            </span>
          )}
        </div>
      </div>

      {/* Expanded image overlay */}
      {expandedImage && (
        <div className={styles.expandedImageOverlay} onClick={closeExpandedImage}>
          <div className={styles.expandedImageContainer}>
            <button className={styles.closeButton} onClick={closeExpandedImage}>
              <FaTimes />
            </button>
            <img 
              src={expandedImage} 
              alt="Expanded view" 
              className={styles.expandedImage}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;