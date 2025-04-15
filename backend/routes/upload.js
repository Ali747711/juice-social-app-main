// routes/upload.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

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
    const userId = req.userId.toString(); // Add .toString() here
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
    // Generate unique filename to avoid collisions
    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
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

// Upload endpoint
router.post('/', auth, (req, res) => {
  console.log("File upload request received");
  console.log("Request headers:", req.headers);
  console.log("Files in request:", req.files ? req.files.length : 'None');
  
  upload.array('files', 5)(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred
      console.error("Multer error:", err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          message: 'File too large. Maximum file size is 10MB.' 
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      // An unknown error occurred
      console.error("Unknown upload error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
    
    // Check if files were received
    if (!req.files || req.files.length === 0) {
      console.error("No files were uploaded");
      return res.status(400).json({ success: false, message: 'No files were uploaded' });
    }
    
    console.log("Files uploaded successfully:", req.files.length);
    
    // Process uploaded files
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    console.log("Base URL for file access:", baseUrl);
    
    const files = req.files.map(file => {
      // Determine file type
      let fileType = 'file';
      if (file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        fileType = 'video';
      }
      
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
        url: `${baseUrl}/uploads/${req.userId}/${file.filename}`,
        path: file.path
      };
    });
    
    console.log("Sending response with files");
    return res.status(200).json({
      success: true,
      files: files
    });
  });
});

// Add this route to serve uploaded files
router.get('/:userId/:filename', (req, res) => {
  const { userId, filename } = req.params;
  const filePath = path.join(uploadDir, userId, filename);
  
  console.log("File access request:", filePath);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    console.log("File found, serving");
    res.sendFile(filePath);
  } else {
    console.log("File not found");
    res.status(404).json({ message: 'File not found' });
  }
});

module.exports = router;