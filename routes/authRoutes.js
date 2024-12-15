const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// GET route to show available endpoints
router.get('/', (req, res) => {
    res.json({
        message: 'Auth API is working',
        availableRoutes: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            forgotPassword: 'POST /api/auth/forgot-password',
            resetPassword: 'POST /api/auth/reset-password'
        }
    });
});

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Optional: Verify reset token route
router.get('/reset-password/:token', authController.verifyResetToken);

module.exports = router;
