const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendResetPasswordEmail } = require('../utils/emailService');


exports.register = async (req, res) => {
  try {
      const { email, password } = req.body;

      // Debug logs
      console.log('Current database:', mongoose.connection.db.databaseName);
      console.log('Current collections:', await mongoose.connection.db.listCollections().toArray());

      // Check if user exists
      let user = await User.findOne({ email });
      console.log('Existing user check:', user);

      if (user) {
          return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      user = new User({
          email,
          password
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save user with explicit collection
      console.log('Saving to collection:', User.collection.name);
      await user.save();

      // Verify save
      const savedUser = await User.findOne({ email });
      console.log('Saved user:', savedUser);

      res.status(201).json({
          message: 'User registered successfully'
      });
  } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
          message: 'Error registering user',
          error: error.message
      });
  }
};



// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot Password


// authController.js or similar

const handleForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Received forgot password request for:', email);

    // Find user
    const user = await User.findOne({ email });
    
    if (user) {
      // Generate token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Save token to user
      user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send email
      console.log('Sending reset email to:', email);
      const emailResult = await sendResetPasswordEmail(email, resetToken);
      console.log('Email result:', emailResult);
    }

    // Always return same response
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request.'
    });
  }
};






// Reset Password
exports.resetPassword = async (req, res) => {
  try {
      const { token } = req.params;
      const { password } = req.body;

      // Validation
      if (!token || !password) {
          return res.status(400).json({
              message: 'Token and password are required'
          });
      }

      // Hash the token from the URL
      const resetPasswordToken = crypto
          .createHash('sha256')
          .update(token)
          .digest('hex');

      // Find user with matching token and valid expiry
      const user = await User.findOne({
          resetPasswordToken: resetPasswordToken,
          resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
          return res.status(400).json({
              message: 'Invalid or expired reset token'
          });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update user
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      return res.status(200).json({
          message: 'Password reset successful'
      });

  } catch (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({
          message: 'Error resetting password',
          error: error.message
      });
  }
};


// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user
    const user = await User.findById(req.user.id);

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify Reset Token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash token
    const resetPasswordToken = XXXXXX
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token'
      });
    }

    res.json({ message: 'Valid reset token' });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      message: 'Error verifying reset token'
    });
  }
};

module.exports = {
  register,
  login,
  handleForgotPassword,
  resetPassword,
  getCurrentUser,
  changePassword,
  verifyResetToken
};
