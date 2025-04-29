
/**
 * Generate OTP
 * @param {Number} length - Length of OTP
 * @returns {String} - Generated OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let OTP = '';
  
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  
  return OTP;
};

/**
 * Calculate OTP expiry time
 * @param {Number} minutes - Minutes until expiry
 * @returns {Date} - Expiry date
 */
const calculateOTPExpiry = (minutes = 15) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = {
  generateOTP,
  calculateOTPExpiry,
};
