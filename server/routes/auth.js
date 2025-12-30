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

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = user.generateAuthToken();

        res.json({
            user: {
                _id: user._id,
                email: user.email,
                selectedSports: user.selectedSports
            },
            token
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Error signing in' });
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
