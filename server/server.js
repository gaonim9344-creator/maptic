const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config(); // Also load .env from current directory (server/) if exists


const authRoutes = require('./routes/auth');
const preferencesRoutes = require('./routes/preferences');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        // Don't exit process in development, nodemon will restart on fix
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

connectDB();

// Connection Events
mongoose.connection.on('error', err => {
    console.error('❌ MongoDB runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    // Explicitly serve SEO files for Google Search Console
    app.get('/sitemap.xml', (req, res) => {
        console.log('🤖 Sitemap requested');
        res.sendFile(path.join(__dirname, '../client/dist/sitemap.xml'));
    });

    app.get('/robots.txt', (req, res) => {
        console.log('🤖 Robots.txt requested');
        res.sendFile(path.join(__dirname, '../client/dist/robots.txt'));
    });

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 MONGODB_URI is ${process.env.MONGODB_URI ? 'SET' : 'MISSING'}`);
    console.log(`🔑 NAVER_SEARCH_CLIENT_ID is ${process.env.NAVER_SEARCH_CLIENT_ID ? 'SET' : 'MISSING'}`);
});
