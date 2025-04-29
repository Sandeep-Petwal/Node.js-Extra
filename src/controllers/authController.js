
const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');
const { generateOTP, calculateOTPExpiry } = require('../utils/otpUtils');
const { sendVerificationEmail } = require('../utils/emailService');
const createError = require('http-errors');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return next(createError(400, 'User already exists'));
    }
    
    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpiry = calculateOTPExpiry(15); // 15 minutes expiry
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      verificationOtp: {
        otp,
        expiresAt: otpExpiry,
      },
    });
    
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(email, otp);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification OTP.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user email with OTP
 * @route POST /api/auth/verify-email
 * @access Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return next(createError(404, 'User not found'));
    }
    
    // Check if user is already verified
    if (user.isVerified) {
      return next(createError(400, 'Email already verified'));
    }
    
    // Check if OTP exists and is valid
    if (
      !user.verificationOtp ||
      !user.verificationOtp.otp ||
      !user.verificationOtp.expiresAt
    ) {
      return next(createError(400, 'OTP not found, please request a new one'));
    }
    
    // Check if OTP is expired
    if (user.verificationOtp.expiresAt < new Date()) {
      return next(createError(400, 'OTP expired, please request a new one'));
    }
    
    // Check if OTP matches
    if (user.verificationOtp.otp !== otp) {
      return next(createError(400, 'Invalid OTP'));
    }
    
    // Update user verification status
    user.isVerified = true;
    user.verificationOtp = undefined;
    await user.save();
    
    // Generate JWT token
    const token = generateToken({ id: user._id });
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification OTP
 * @route POST /api/auth/resend-otp
 * @access Public
 */
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return next(createError(404, 'User not found'));
    }
    
    // Check if user is already verified
    if (user.isVerified) {
      return next(createError(400, 'Email already verified'));
    }
    
    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = calculateOTPExpiry(15); // 15 minutes expiry
    
    // Update user OTP
    user.verificationOtp = {
      otp,
      expiresAt: otpExpiry,
    };
    
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(email, otp);
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully. Please check your email.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Check if user exists
    if (!user) {
      return next(createError(401, 'Invalid email or password'));
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      return next(createError(401, 'Please verify your email first'));
    }
    
    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return next(createError(401, 'Invalid email or password'));
    }
    
    // Generate JWT token
    const token = generateToken({ id: user._id });
    
    // Set cookie options
    const cookieOptions = {
      expires: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };
    
    // Send response with token in cookie and body
    res
      .status(200)
      .cookie('token', token, cookieOptions)
      .json({
        success: true,
        message: 'Logged in successfully',
        token,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
const logout = (req, res) => {
  res
    .status(200)
    .cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // 10 seconds
      httpOnly: true,
    })
    .json({
      success: true,
      message: 'Logged out successfully',
    });
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getCurrentUser = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isVerified: req.user.isVerified,
      createdAt: req.user.createdAt,
    },
  });
};

module.exports = {
  register,
  verifyEmail,
  resendOtp,
  login,
  logout,
  getCurrentUser,
};
