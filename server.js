require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// CORS configuration for Netlify frontend
app.use(cors({
    origin: [
        'http://localhost:3000',  // local frontend
        'https://ozbourne-pass-reset.netlify.app', // your actual Netlify domain
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Important: Add body parsing middleware before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// MongoDB connection with better error handling
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);  // Exit if database connection fails
    });

// Root route with API documentation
app.get('/', (req, res) => {
    try {
        res.status(200).json({ 
            status: 'success',
            message: 'Password Reset API is running',
            endpoints: {
                auth: {
                    register: '/api/auth/register',
                    login: '/api/auth/login',
                    forgotPassword: '/api/auth/forgot-password',
                    resetPassword: '/api/auth/reset-password/:token'
                },
                health: '/health'
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error loading API documentation',
            error: error.message
        });
    }
});

// API routes
app.use('/api/auth', require('./routes/authRoutes'));

// Health check route
app.get('/health', (req, res) => {
    try {
        res.status(200).json({ 
            status: 'success',
            timestamp: new Date(),
            mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            service: 'operational'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message
        });
    }
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).json({ 
        status: 'error',
        message: 'Route not found',
        requested: `${req.method} ${req.path}`
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({ 
        status: 'error',
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
});
