// routes/upload.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const FileService = require('../utils/fileService');

const router = express.Router();

// Logging for debugging
console.log("Upload route being initialized");
const uploadDir = path.join(__dirname, '../uploads');
console.log("Upload directory path:", uploadDir);

// Make sure upload directory exists
if (!fs.existsSync(uploadDir)) {
  console.log("Creating upload directory");
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Upload directory created successfully");
  } catch (error) {
    console.error("Error creating upload directory:", error);
  }
} else {
  console.log("Upload directory already exists");
}

// Configure storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Setting destination for file:", file.originalname);
    // Convert ObjectId to string
    const userId = req.userId.toString();
    console.log("User ID for file upload:", userId);
    
    const userDir = path.join(uploadDir, userId);
    console.log("User directory path:", userDir);
    
    // Create user directory if it doesn't exist
    if (!fs.existsSync(userDir)) {
      console.log("Creating user directory");
      try {
        fs.mkdirSync(userDir, { recursive: true });
        console.log("User directory created successfully");
      } catch (error) {
        console.error("Error creating user directory:", error);
        return cb(error);
      }
    }
    
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    console.log("Setting filename for:", file.originalname);
    // Generate unique filename with user ID included for extra uniqueness
    // Sanitize original filename to remove special characters that could cause issues
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${req.userId}-${uuidv4()}-${sanitizedName}`;
    console.log("Generated filename:", uniqueFileName);
    cb(null, uniqueFileName);
  }
});

// Create file upload middleware with file size limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit per file
  },
  fileFilter: function (req, file, cb) {
    console.log("Filtering file:", file.originalname, file.mimetype);
    // Allow only certain file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      console.log("File type allowed:", file.mimetype);
      cb(null, true);
    } else {
      console.log("File type not allowed:", file.mimetype);
      cb(new Error('Invalid file type. Only images, videos, PDFs, Office documents and text files are allowed.'));
    }
  }
});

// Helper function to determine file type
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) {
    return 'image';
  } else if (mimetype.startsWith('video/')) {
    return 'video';
  }
  return 'file';
};

// Upload endpoint
router.post('/', auth, (req, res) => {
  console.log("File upload request received");
  
  upload.array('files', 5)(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred
      console.error("Multer error:", err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(
          res, 
          'File too large. Maximum file size is 10MB.', 
          'FILE_TOO_LARGE', 
          null, 
          400
        );
      }
      return sendError(res, err.message, 'UPLOAD_ERROR', null, 400);
    } else if (err) {
      // An unknown error occurred
      console.error("Unknown upload error:", err);
      return sendError(res, err.message, 'SERVER_ERROR', null, 500);
    }
    
    // Check if files were received
    if (!req.files || req.files.length === 0) {
      console.error("No files were uploaded");
      return sendError(res, 'No files were uploaded', 'NO_FILES', null, 400);
    }
    
    console.log("Files uploaded successfully:", req.files.length);
    
    // Process uploaded files
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    console.log("Base URL for file access:", baseUrl);
    
    const files = req.files.map(file => {
      // Determine file type
      const fileType = getFileType(file.mimetype);
      
      console.log("Processed file:", {
        name: file.originalname,
        size: file.size,
        type: fileType,
        path: file.path
      });
      
      return {
        name: file.originalname,
        size: file.size,
        type: fileType,
        url: `${baseUrl}/api/upload/${req.userId}/${file.filename}`,
        path: file.path
      };
    });
    
    console.log("Sending response with files");
    return sendSuccess(res, 'Files uploaded successfully', { files }, 200);
  });
});

// Middleware to check file access permissions
const checkFileAccess = async (req, res, next) => {
  try {
    const { userId, filename } = req.params;
    
    // If no auth token provided, only allow access to public media files (images/videos)
    if (!req.header('Authorization')) {
      if (FileService.isPublicMediaFile(filename)) {
        return next();
      } else {
        return sendError(res, 'Authentication required to access this file', 'AUTH_REQUIRED', null, 401);
      }
    }
    
    // If auth token is provided, use the auth middleware
    auth(req, res, async () => {
      try {
        // Check if user has permission to access this file
        const hasAccess = await FileService.hasFileAccess(userId, filename, req.userId.toString());
        
        if (hasAccess) {
          return next();
        } else {
          return sendError(res, 'You do not have permission to access this file', 'PERMISSION_DENIED', null, 403);
        }
      } catch (error) {
        console.error("Error checking file access:", error);
        return sendError(res, 'Server error', 'SERVER_ERROR', null, 500);
      }
    });
  } catch (error) {
    console.error("File access check error:", error);
    return sendError(res, 'Server error', 'SERVER_ERROR', null, 500);
  }
};

// Serve uploaded files (with permission check)
router.get('/:userId/:filename', checkFileAccess, (req, res) => {
  const { userId, filename } = req.params;
  const filePath = path.join(uploadDir, userId, filename);
  
  console.log("File access request:", filePath);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    console.log("File found, serving");
    
    // Set appropriate content type
    const contentType = FileService.getContentType(filename);
    res.setHeader('Content-Type', contentType);
    
    // Security headers
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Set cache control for better performance
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error serving file:", err);
        return sendError(res, 'Error serving file', 'SERVER_ERROR', null, 500);
      }
    });
  } else {
    console.log("File not found");
    return sendError(res, 'File not found', 'FILE_NOT_FOUND', null, 404);
  }
});

// Delete a file (only the owner can delete)
router.delete('/:userId/:filename', auth, async (req, res) => {
  const { userId, filename } = req.params;
  
  // Check if user is the owner of the file
  if (req.userId.toString() !== userId) {
    return sendError(
      res, 
      'You do not have permission to delete this file', 
      'PERMISSION_DENIED', 
      null, 
      403
    );
  }
  
  try {
    // Use FileService to delete the file and clean up references
    const result = await FileService.deleteFile(userId, filename);
    
    if (result.success) {
      return sendSuccess(res, 'File deleted successfully', {
        referencesRemoved: result.referencesRemoved
      });
    } else {
      if (result.error === 'FILE_NOT_FOUND') {
        return sendError(res, 'File not found', 'FILE_NOT_FOUND', null, 404);
      } else {
        return sendError(res, `Error deleting file: ${result.error}`, 'SERVER_ERROR', null, 500);
      }
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    return sendError(res, 'Error deleting file', 'SERVER_ERROR', null, 500);
  }
});

module.exports = router;
