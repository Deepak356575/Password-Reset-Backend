const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter based on environment
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Use App Password if 2FA is enabled
  }
});

const sendResetPasswordEmail = async (email, resetToken) => {
  if (!email) {
    throw new Error('Email address is required');
  }

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"Password Reset" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Password Reset Request</h2>
          
          <p style="color: #666; margin-bottom: 15px;">
            You requested a password reset for your account. Click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              If you didn't request this password reset, please ignore this email.
              This link will expire in 1 hour.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    console.log('Attempting to send password reset email to:', email);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw {
      message: 'Failed to send password reset email',
      error: error.message,
      code: error.code
    };
  }
};

// Test function
const testEmailService = async (testEmail) => {
  if (!testEmail) {
    throw new Error('Test email address is required');
  }
  
  try {
    console.log('Testing email service with address:', testEmail);
    const result = await sendResetPasswordEmail(testEmail, 'test-reset-token');
    console.log('Test email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Test email failed:', error);
    throw error;
  }
};

module.exports = {
  sendResetPasswordEmail,
};
