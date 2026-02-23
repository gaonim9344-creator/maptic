const mongoose = require('mongoose');

const facilityImageSchema = new mongoose.Schema({
    uid: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true }  // base64 또는 URL
});

const facilitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, '시설명을 입력해주세요'],
        trim: true,
        maxlength: [100, '시설명은 100자 이내로 입력해주세요']
    },
    address: {
        type: String,
        required: [true, '주소를 입력해주세요'],
        trim: true
    },
    category: {
        type: String,
        required: [true, '종목을 선택해주세요']
    },
    price_daily: {
        type: Number,
        required: [true, '일일권 가격을 입력해주세요'],
        min: [0, '가격은 0 이상이어야 합니다']
    },
    price_monthly: {
        type: Number,
        required: [true, '월 이용권 가격을 입력해주세요'],
        min: [0, '가격은 0 이상이어야 합니다']
    },
    price_yearly: {
        type: Number,
        required: [true, '연 이용권 가격을 입력해주세요'],
        min: [0, '가격은 0 이상이어야 합니다']
    },
    description: {
        type: String,
        required: [true, '시설 설명을 입력해주세요'],
        maxlength: [1000, '설명은 1000자 이내로 입력해주세요']
    },
    features: [{
        type: String,
        enum: ['샤워실', '주차', '운동복']
    }],
    images: [facilityImageSchema],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false  // 나중에 인증 연동 시 required: true로 변경
    }
}, {
    timestamps: true  // createdAt, updatedAt 자동 생성
});

// 인덱스 설정 (검색 최적화)
facilitySchema.index({ name: 'text', address: 'text', description: 'text' });
facilitySchema.index({ category: 1 });
facilitySchema.index({ owner: 1 });

module.exports = mongoose.model('Facility', facilitySchema);
