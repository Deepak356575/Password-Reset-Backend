require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// CORS configuration for Netlify frontend
app.use(cors({
    origin: [
        'http://localhost:5000',  // local frontend
        'https://ozbourne-pass-reset.netlify.app/', // your Netlify domain
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

    // Add a root route handler
app.get('/', (req, res) => {
  res.json({ 
      message: 'Password Reset API is running',
      endpoints: {
          auth: '/api/auth',
          health: '/health'
      }
  });
});

// API routes
app.use('/api/auth', require('./routes/authRoutes'));

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
