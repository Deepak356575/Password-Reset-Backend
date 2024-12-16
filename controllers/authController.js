const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Register user


exports.register = async (req, res) => {
    try {
        console.log('Register endpoint hit with body:', req.body);

        const { username, email, password } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
                missing: {
                    username: !username,
                    email: !email,
                    password: !password
                }
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};





// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            userId: user._id
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

// Forgot password

const crypto = require('crypto'); // Add this at the top

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        console.log('Received forgot password request for:', email); // Debug log

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token using crypto
        const resetToken = crypto.randomBytes(32).toString('hex');
        console.log('Generated reset token:', resetToken); // Debug log

        // Save token and expiry
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        try {
            // Email configuration
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            // Send email
            await transporter.sendMail({
                from: process.env.EMAIL_USERNAME,
                to: email,
                subject: 'Password Reset Request',
                html: `
                    <h1>Password Reset</h1>
                    <p>Click the link below to reset your password:</p>
                    <a href="${resetUrl}">${resetUrl}</a>
                    <p>This link will expire in 1 hour.</p>
                `
            });

            // Return success response with token
            return res.status(200).json({
                status: 'success',
                message: 'Password reset link sent to email',
                resetToken: resetToken,
                resetUrl: resetUrl
            });

        } catch (emailError) {
            // If email sending fails, still return the token for testing
            console.error('Email sending failed:', emailError);
            return res.status(200).json({
                status: 'success',
                message: 'Email sending failed, but token generated',
                resetToken: resetToken,
                resetUrl: resetUrl
            });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ 
            status: 'error',
            message: 'Error in forgot password process',
            error: error.message 
        });
    }
};

// Reset Password
// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;  // Changed from password to newPassword

        // Validation
        if (!token || !newPassword) {
            return res.status(400).json({
                message: 'Token and new password are required'
            });
        }

        console.log('Reset attempt with token:', token);
        console.log('New password received:', !!newPassword);

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(400).json({
                message: 'Invalid or expired reset token'
            });
        }

        // Update password
        user.password = newPassword;
        
        // Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({
            message: 'Password reset successful'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            message: 'Error resetting password',
            error: error.message
        });
    }
};



// Add a verify token endpoint
exports.verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Invalid or expired reset token'
            });
        }

        res.status(200).json({
            message: 'Token is valid',
            email: user.email
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error verifying token',
            error: error.message
        });
    }
};
