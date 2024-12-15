const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/verify-token/:token', authController.verifyResetToken);

// Health check endpoint
router.get('/health', (req, res) => {
  const currentTime = new Date().toISOString();
  res.json({
      message: "Password Reset API is running",
      deploymentTime: currentTime,
      buildVersion: "1.0.2",
      endpoints: {
          auth: {
              register: "/api/auth/register",
              login: "/api/auth/login",
              forgotPassword: "/api/auth/forgot-password",
              resetPassword: "/api/auth/reset-password/:token"
          },
          health: "/health"
      },
      environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
