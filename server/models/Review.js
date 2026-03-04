const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    facility: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Facility',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: [true, '댓글 내용을 입력해주세요'],
        trim: true,
        maxlength: [500, '댓글은 500자 이내로 입력해주세요']
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 5
    }
}, {
    timestamps: true
});

// 인덱스 설정
reviewSchema.index({ facility: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
