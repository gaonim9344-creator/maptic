const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user preferences
router.get('/', auth, async (req, res) => {
    try {
        res.json({ selectedSports: req.user.selectedSports });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ error: 'Error fetching preferences' });
    }
});

// Update user preferences
router.put('/', auth, async (req, res) => {
    try {
        const { selectedSports } = req.body;

        if (!Array.isArray(selectedSports)) {
            return res.status(400).json({ error: 'selectedSports must be an array' });
        }

        req.user.selectedSports = selectedSports;
        await req.user.save();

        res.json({
            selectedSports: req.user.selectedSports,
            message: 'Preferences updated successfully'
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ error: 'Error updating preferences' });
    }
});

module.exports = router;
