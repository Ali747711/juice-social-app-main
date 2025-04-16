// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: 'default-avatar.png'
  },
  bio: {
    type: String,
    default: '',
    maxlength: 160
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  darkMode: {
    type: Boolean,
    default: false
  },
  // Add field to track password changes for token validation
  passwordChangedAt: {
    type: Date
  }
}, { timestamps: true });

// Pre-save hook to hash the password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // If this is a password change (not a new user), update passwordChangedAt
    if (this.isModified('password') && !this.isNew) {
      this.passwordChangedAt = new Date();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if token was issued after password change
UserSchema.methods.isTokenValid = function(tokenIssuedAt) {
  if (!this.passwordChangedAt) return true;
  
  // Convert date to seconds timestamp for comparison with JWT iat
  const passwordChangedTimestamp = parseInt(
    this.passwordChangedAt.getTime() / 1000, 
    10
  );
  
  return tokenIssuedAt >= passwordChangedTimestamp;
};

module.exports = mongoose.model('User', UserSchema);