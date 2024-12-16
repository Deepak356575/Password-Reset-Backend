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
        
        // Add these debug logs
        console.log('Environment Variables:');
        console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Force the production URL if localhost is detected
        const frontendURL = process.env.FRONTEND_URL;
        if (!frontendURL || frontendURL.includes('localhost')) {
            console.error('Invalid FRONTEND_URL detected:', frontendURL);
            return res.status(500).json({ 
                status: 'error',
                message: 'Invalid frontend URL configuration'
            });
        }

        const resetUrl = `${frontendURL}/reset-password/${resetToken}`;
        console.log('Reset URL generated:', resetUrl); // Debug log

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset</h1>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>This link will expire in 1 hour.</p>
            `
        };

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail(mailOptions);
        
        return res.status(200).json({
            status: 'success',
            message: 'Password reset link sent to email'
        });

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

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        console.log('Reset password attempt received:', {
            token: token ? 'exists' : 'missing',
            newPassword: newPassword ? 'exists' : 'missing'
        });

        // Input validation
        if (!token || !newPassword) {
            return res.status(400).json({
                status: 'error',
                message: 'Password and token are required'
            });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        console.log('User search result:', {
            found: !!user,
            tokenMatch: user?.resetPasswordToken === token,
            tokenExpired: user?.resetPasswordExpires < Date.now()
        });

        if (!user) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid or expired reset token'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password has been reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error resetting password'
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
