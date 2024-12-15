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
    res.json({
        message: "Password Reset API is running",
        endpoints: {
            auth: {
                register: "/api/auth/register",          // Removed [POST]
                login: "/api/auth/login",               // Removed [POST]
                forgotPassword: "/api/auth/forgot-password", // Removed [POST]
                resetPassword: "/api/auth/reset-password/:token"  // Added :token parameter
            },
            health: "/health"                           // Removed [GET]
        }
    });
});

module.exports = router;
