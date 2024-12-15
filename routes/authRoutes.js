// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// GET route to show API documentation
router.get('/', (req, res) => {
    res.json({
        message: 'Auth API endpoints',
        endpoints: {
            register: {
                method: 'POST',
                url: '/api/auth/register',
                body: {
                    email: 'required|string',
                    password: 'required|string'
                }
            },
            login: {
                method: 'POST',
                url: '/api/auth/login',
                body: {
                    email: 'required|string',
                    password: 'required|string'
                }
            },
            forgotPassword: {
                method: 'POST',
                url: '/api/auth/forgot-password',
                body: {
                    email: 'required|string'
                }
            }
        }
    });
});

// Auth routes - all are POST methods
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
