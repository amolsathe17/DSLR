const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, mobile, password, city, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      city,
      role: 'Participant',
      otp,
      otpExpires,
      isVerified: false
    });

    // Log the OTP for local development
    console.log(`[OTP Verification] User: ${email}, OTP: ${otp}`);

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'Register',
      details: `User registered as ${user.role}. Verification pending.`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Verify email using the OTP sent.',
      userId: user._id,
      devOtp: otp // For easy local testing
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Verify Email OTP
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User email is already verified' });
    }

    if (user.otp !== otp || new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'Email Verification',
      details: 'Email verified successfully.',
      ipAddress: req.ip
    });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dslr_photography_jwt_secret_key', {
      expiresIn: '30d'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      // Re-trigger OTP
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      console.log(`[OTP Re-send] User: ${email}, OTP: ${otp}`);

      return res.status(403).json({
        success: false,
        message: 'Email not verified. OTP sent to your email.',
        requiresVerification: true,
        userId: user._id,
        devOtp: otp
      });
    }

    user.lastLogin = new Date();
    await user.save();

    // Log Login
    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'Login',
      details: 'User logged in successfully.',
      ipAddress: req.ip
    });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dslr_photography_jwt_secret_key', {
      expiresIn: '30d'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Forgot Password - request OTP
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`[OTP Reset Password] User: ${email}, OTP: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully for password reset.',
      userId: user._id,
      devOtp: otp
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otp !== otp || new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'Password Reset',
      details: 'Password reset successful.',
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Password reset successful. You can log in now.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      mobile: req.user.mobile,
      city: req.user.city,
      role: req.user.role,
      notifications: req.user.notifications || []
    }
  });
});

// @desc    Mark a notification as read
// @route   POST /api/auth/notifications/:notifId/read
// @access  Private
router.post('/notifications/:notifId/read', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { notifId } = req.params;
    
    // Try to find by id
    let notifFound = false;
    if (user.notifications && typeof user.notifications.id === 'function') {
      const notif = user.notifications.id(notifId);
      if (notif) {
        notif.isRead = true;
        notifFound = true;
      }
    }

    // Fallback to matching index
    if (!notifFound && user.notifications) {
      const idx = parseInt(notifId);
      if (!isNaN(idx) && user.notifications[idx]) {
        user.notifications[idx].isRead = true;
        notifFound = true;
      }
    }

    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email address is already in use' });
      }
      user.email = req.body.email;
    }

    user.name = req.body.name || user.name;
    user.mobile = req.body.mobile || user.mobile;
    user.city = req.body.city || user.city;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'Update Profile',
      details: 'User details updated.',
      ipAddress: req.ip
    });
    res.json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        city: updatedUser.city,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Request OTP for mobile login/signup
// @route   POST /api/auth/mobile-otp-request
// @access  Public
router.post('/mobile-otp-request', async (req, res) => {
  try {
    const { mobile, isSignup, name, city, role } = req.body;

    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    let user = await User.findOne({ mobile });

    if (isSignup) {
      if (user) {
        return res.status(400).json({ success: false, message: 'Mobile number already registered. Please log in.' });
      }
      if (!name || !city) {
        return res.status(400).json({ success: false, message: 'Name and City are required for signup.' });
      }

      // Generate a temporary unique email for mobile-only users
      const email = `mobile-${mobile}-${Date.now().toString().slice(-4)}@contest.com`;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), salt); // Random password

      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      user = await User.create({
        name,
        email,
        mobile,
        password: hashedPassword,
        city,
        role: 'Participant',
        otp,
        otpExpires,
        isVerified: false
      });

      console.log(`[Mobile Signup OTP] User: ${mobile}, OTP: ${otp}`);
      
      await AuditLog.create({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'Mobile Signup Request',
        details: 'Mobile signup pending verification.',
        ipAddress: req.ip
      });

      return res.status(201).json({
        success: true,
        message: 'Signup OTP generated. Verify to complete registration.',
        userId: user._id,
        devOtp: otp
      });

    } else {
      // Login flow
      if (!user) {
        return res.status(404).json({ success: false, message: 'Mobile number not registered. Please sign up first.' });
      }

      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      console.log(`[Mobile Login OTP] User: ${mobile}, OTP: ${otp}`);

      return res.json({
        success: true,
        message: 'Login OTP sent successfully.',
        userId: user._id,
        devOtp: otp
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Verify Mobile OTP (login/signup)
// @route   POST /api/auth/mobile-otp-verify
// @access  Public
router.post('/mobile-otp-verify', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otp !== otp || new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'Mobile OTP Verification',
      details: 'User authenticated via Mobile OTP.',
      ipAddress: req.ip
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dslr_photography_jwt_secret_key', {
      expiresIn: '30d'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
