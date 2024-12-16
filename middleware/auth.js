// D:\GUVI\Password\Backend\middleware\auth.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                message: 'No token, authorization denied'
            });
        }

        // Verify token
        // Make sure your token verification looks something like this

  
        
        // Add user from payload
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            message: 'Token is not valid',
            error: error.message
        });
    }
};

module.exports = auth;
