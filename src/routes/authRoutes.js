
const express = require('express');
const {
  register,
  verifyEmail,
  resendOtp,
  login,
  logout,
  getCurrentUser,
} = require('../controllers/authController');
const {
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  validate,
} = require('../middlewares/validators');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/verify-email', verifyOtpValidation, validate, verifyEmail);
router.post('/resend-otp', resendOtp);
router.post('/login', loginValidation, validate, login);

// Protected routes
router.use(protect);
router.get('/me', getCurrentUser);
router.post('/logout', logout);

module.exports = router;
