const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const auth = require('../middleware/auth');

// GET /api/reviews/facility/:facilityId - Get all reviews for a facility
router.get('/facility/:facilityId', async (req, res) => {
    try {
        const reviews = await Review.find({ facility: req.params.facilityId })
            .sort({ createdAt: -1 })
            .lean();

        res.json(reviews);
    } catch (error) {
        console.error('Failed to fetch reviews:', error);
        res.status(500).json({ error: '댓글을 불러오는데 실패했습니다' });
    }
});

// POST /api/reviews - Add a new review
router.post('/', auth, async (req, res) => {
    try {
        const { facility, content, rating } = req.body;

        if (!facility || !content) {
            return res.status(400).json({ error: '필수 필드가 누락되었습니다' });
        }

        const newReview = new Review({
            facility,
            user: req.user._id,
            userName: req.user.username || req.user.name || '익명 사용자',
            content,
            rating: rating || 5
        });

        const savedReview = await newReview.save();
        res.status(201).json(savedReview);
    } catch (error) {
        console.error('Failed to save review:', error);
        res.status(500).json({ error: '댓글 저장에 실패했습니다' });
    }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ error: '댓글을 찾을 수 없습니다' });
        }

        // Only the author can delete
        if (review.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: '본인 댓글만 삭제할 수 있습니다' });
        }

        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: '댓글이 삭제되었습니다' });
    } catch (error) {
        console.error('Failed to delete review:', error);
        res.status(500).json({ error: '댓글 삭제에 실패했습니다' });
    }
});

module.exports = router;
