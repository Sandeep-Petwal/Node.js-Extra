
/**
 * Global error handler middleware
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  
  // Specific error handling
  let error = { ...err };
  error.message = message;
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error.message = messages.join(', ');
    error.statusCode = 400;
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error.statusCode = 400;
  }
  
  // Mongoose cast error
  if (err.name === 'CastError') {
    error.message = `Invalid ${err.path}: ${err.value}`;
    error.statusCode = 400;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token, please log in again';
    error.statusCode = 401;
  }
  
  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired, please log in again';
    error.statusCode = 401;
  }
  
  // Development vs Production error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      error: err,
      message: error.message,
      stack: err.stack,
    });
  }
  
  // Production error response
  return res.status(statusCode).json({
    success: false,
    message: error.message,
  });
};

module.exports = {
  errorHandler,
};
