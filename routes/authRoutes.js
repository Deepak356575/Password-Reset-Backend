const express = require('express');
const router = express.Router();
const { register } = require('../controllers/authController');


// Auth routes
router.post('/register', register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/verify-token/:token', authController.verifyResetToken);

// Health check endpoint

module.exports = router;
