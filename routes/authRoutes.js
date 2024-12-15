const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword); // Note the :token parameter
router.get('/verify-token/:token', authController.verifyResetToken);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        message: "Password Reset API is running",
        endpoints: {
            auth: {
                register: "/api/auth/register [POST]",
                login: "/api/auth/login [POST]",
                forgotPassword: "/api/auth/forgot-password [POST]",
                resetPassword: "/api/auth/reset-password/:token [POST]", // Updated to show token parameter
                verifyToken: "/api/auth/verify-token/:token [GET]"
            },
            health: "/health [GET]"
        }
    });
});

module.exports = router;
