require('dotenv').config();
console.log('Server starting with FRONTEND_URL:', process.env.FRONTEND_URL);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// CORS configuration with more specific options
app.use(cors({
    origin: ['https://ozbourne-pass-reset.netlify.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://ozbourne-pass-reset.netlify.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    // Add additional security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});

// Body parsing middleware - IMPORTANT: Place these before routes
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.options('*', cors());

// Request logging middleware with body logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.method === 'POST') {
        console.log('Request body:', req.body);
    }
    next();
});

// MongoDB connection with better error handling and options
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
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

// API routes with error handling
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
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        error: err.message
    });
});
    
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // Handle mongoose duplicate key errors
    if (err.code === 11000) {
        return res.status(400).json({
            status: 'error',
            message: 'Duplicate field value entered',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    res.status(err.status || 500).json({ 
        status: 'error',
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});
