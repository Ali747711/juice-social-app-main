// utils/fileService.js
const Message = require('../models/Message');
const fs = require('fs');
const path = require('path');

/**
 * Utility service for handling file operations
 * Provides functions for cleaning up file references and checking file permissions
 */
class FileService {
  /**
   * Check if a user has access to a specific file
   * @param {string} fileUserId - The user ID that owns the file
   * @param {string} filename - The filename to check
   * @param {string} currentUserId - The ID of the current user requesting access
   * @returns {Promise<boolean>} - Whether the user has access to the file
   */
  static async hasFileAccess(fileUserId, filename, currentUserId) {
    // If user is the owner, they always have access
    if (fileUserId === currentUserId) {
      return true;
    }

    // Check if the file is part of a message sent to the current user
    const message = await Message.findOne({
      sender: fileUserId,
      receiver: currentUserId,
      'files.url': { $regex: new RegExp(`${fileUserId}/${filename}$`) }
    });

    return !!message;
  }

  /**
   * Clean up file references in messages when a file is deleted
   * @param {string} userId - The user ID that owns the file
   * @param {string} filename - The filename to clean up
   * @returns {Promise<number>} - Number of messages updated
   */
  static async cleanupFileReferences(userId, filename) {
    try {
      // Find messages that reference this file
      const filePattern = new RegExp(`${userId}/${filename}$`);
      
      // Update messages that contain this file
      const result = await Message.updateMany(
        { 'files.url': { $regex: filePattern } },
        { $pull: { files: { url: { $regex: filePattern } } } }
      );
      
      return result.modifiedCount;
    } catch (error) {
      console.error('Error cleaning up file references:', error);
      throw error;
    }
  }

  /**
   * Delete a file and clean up references
   * @param {string} userId - The user ID that owns the file
   * @param {string} filename - The filename to delete
   * @returns {Promise<{success: boolean, referencesRemoved: number}>} - Result of deletion
   */
  static async deleteFile(userId, filename) {
    const uploadsDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadsDir, userId, filename);
    
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'FILE_NOT_FOUND' };
      }
      
      // Delete physical file
      fs.unlinkSync(filePath);
      
      // Clean up references in messages
      const referencesRemoved = await this.cleanupFileReferences(userId, filename);
      
      return { 
        success: true, 
        referencesRemoved 
      };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Get appropriate Content-Type for a file
   * @param {string} filename - The filename to check
   * @returns {string} - The content type
   */
  static getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  /**
   * Check if a file is a public media type (image/video)
   * @param {string} filename - The filename to check
   * @returns {boolean} - Whether the file is public media
   */
  static isPublicMediaFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    const publicExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm'];
    
    return publicExts.includes(ext);
  }
}

module.exports = FileService;
