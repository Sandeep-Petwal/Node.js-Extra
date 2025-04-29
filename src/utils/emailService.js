
const nodemailer = require('nodemailer');

/**
 * Create email transporter
 * @returns {Object} - Nodemailer transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send email
 * @param {Object} mailOptions - Email options
 * @returns {Promise} - Email sending result
 */
const sendEmail = async (mailOptions) => {
  try {
    const transporter = createTransporter();
    const defaultMailOptions = {
      from: process.env.EMAIL_FROM,
    };
    
    const info = await transporter.sendMail({
      ...defaultMailOptions,
      ...mailOptions,
    });
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send OTP verification email
 * @param {String} to - Recipient email
 * @param {String} otp - OTP code
 * @returns {Promise} - Email sending result
 */
const sendVerificationEmail = async (to, otp) => {
  const mailOptions = {
    to,
    subject: 'Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Thank you for registering. Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
          <strong>${otp}</strong>
        </div>
        <p>This OTP will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };
  
  return await sendEmail(mailOptions);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
};
