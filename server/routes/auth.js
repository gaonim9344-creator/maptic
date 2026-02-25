const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Sign Up
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Create new user
        const user = new User({ email, password, selectedSports: [] });
        await user.save();

        // Generate token
        const token = user.generateAuthToken();

        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                selectedSports: user.selectedSports
            },
            token
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
});

// Sign In
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[Auth] Signin attempt for email: ${email}`);

        // Validation
        if (!email || !password) {
            console.warn('[Auth] Signin failed: Missing email or password');
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        console.log('[Auth] Finding user in database...');
        const user = await User.findOne({ email });
        if (!user) {
            console.warn(`[Auth] Signin failed: User not found for email: ${email}`);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        console.log('[Auth] Comparing passwords...');
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.warn(`[Auth] Signin failed: Incorrect password for email: ${email}`);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        console.log('[Auth] Generating token...');
        const token = user.generateAuthToken();

        console.log(`[Auth] Signin successful for: ${email}`);
        res.json({
            user: {
                _id: user._id,
                email: user.email,
                selectedSports: user.selectedSports
            },
            token
        });
    } catch (error) {
        console.error('[Auth] Signin error:', error);
        res.status(500).json({
            error: 'Error signing in',
            details: error.message,
            code: 'AUTH_SERVER_ERROR'
        });
    }
});

// Get current user (protected route)
router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        res.json({
            user: {
                _id: req.user._id,
                email: req.user.email,
                selectedSports: req.user.selectedSports
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Error fetching user' });
    }
});

module.exports = router;
