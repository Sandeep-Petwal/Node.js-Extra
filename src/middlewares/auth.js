
const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/User');
const createError = require('http-errors');

/**
 * Protect routes - Verify user authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const protect = async (req, res, next) => {
  try {
    // Get token from header or cookies
    let token;
    
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Check if token exists
    if (!token) {
      return next(createError(401, 'Not authorized, no token provided'));
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user exists
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(createError(401, 'Not authorized, user not found'));
    }
    
    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError(401, 'Not authorized, invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(createError(401, 'Not authorized, token expired'));
    }
    next(error);
  }
};

/**
 * Restrict routes to specific roles
 * @param  {...String} roles - Allowed roles
 * @returns {Function} - Express middleware
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        createError(403, 'You do not have permission to perform this action')
      );
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
