const express = require('express');
const router = express.Router();
const { sendResetPasswordEmail } = require('../utils/emailService');
const {
    register,
    login,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    changePassword,
    verifyResetToken
} = require('../controllers/authController');
const auth = require('../middleware/auth');

// Auth Routes
router.post('/register', register);
router.post('/login', login);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-token/:token', verifyResetToken);

// Protected Routes (require authentication)
router.get('/current-user', auth, getCurrentUser);
router.post('/change-password', auth, changePassword);

// Test email route (for development)
router.post('/test-email', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      error: 'Email is required',
      details: 'Please provide an email address'
    });
  }

  try {
    console.log('Starting email test to:', email);
    await sendResetPasswordEmail(email, 'test-token');
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      info: 'Check your Mailtrap inbox to view the email',
      recipient: email
    });
  } catch (error) {
    console.error('Test email route error:', error);
    
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message,
      errorCode: error.code || 'UNKNOWN',
      recipient: email
    });
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Route error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

module.exports = router;
