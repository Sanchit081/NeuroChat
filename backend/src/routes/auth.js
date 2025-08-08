// src/routes/auth.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { authenticateToken, generateToken, checkOnlineStatus } = require('../middleware/auth');
const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  handleValidationErrors
} = require('../middleware/validation');

const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'));
    }
  }
});

// Register
router.post('/register', validateRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { token, user: user.getPublicProfile() }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Login
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user: user.getPublicProfile() }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Get profile
router.get('/profile', authenticateToken, checkOnlineStatus, (req, res) => {
  res.json({ success: true, data: { user: req.user.getPublicProfile() } });
});

// Update profile
router.put('/profile',
  authenticateToken,
  upload.single('profilePicture'),
  validateProfileUpdate,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, status } = req.body;
      const user = req.user;

      if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ success: false, message: 'Username is already taken' });
        }
        user.username = username;
      }

      if (status !== undefined) {
        user.status = status;
      }

      if (req.file) {
        if (user.profilePicture) {
          const oldPicturePath = path.join(__dirname, '../../', user.profilePicture);
          if (fs.existsSync(oldPicturePath)) fs.unlinkSync(oldPicturePath);
        }
        user.profilePicture = req.file.path.replace(/\\/g, '/');
      }

      await user.save();
      res.json({ success: true, message: 'Profile updated successfully', data: { user: user.getPublicProfile() } });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ success: false, message: 'Server error during profile update' });
    }
  }
);

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
      socketId: null
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
});

// Delete account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (user.profilePicture) {
      const picturePath = path.join(__dirname, '../../', user.profilePicture);
      if (fs.existsSync(picturePath)) fs.unlinkSync(picturePath);
    }

    await User.findByIdAndDelete(user._id);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ success: false, message: 'Server error during account deletion' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
