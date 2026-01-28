const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const auth = require('../middleware/auth');

// GET /api/facilities/my - 내 시설 목록 조회 (로그인 필수)
router.get('/my', auth, async (req, res) => {
    try {
        const facilities = await Facility.find({ owner: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        const formattedFacilities = facilities.map(f => ({
            ...f,
            id: f._id.toString(),
            createdAt: f.createdAt?.toISOString(),
            updatedAt: f.updatedAt?.toISOString()
        }));

        res.json(formattedFacilities);
    } catch (error) {
        console.error('내 시설 목록 조회 오류:', error);
        res.status(500).json({ error: '시설 목록을 불러오는데 실패했습니다' });
    }
});

// GET /api/facilities - 전체 시설 목록 조회 (공개)
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};

        // 카테고리 필터
        if (category) {
            query.category = category;
        }

        // 텍스트 검색
        if (search) {
            query.$text = { $search: search };
        }

        const facilities = await Facility.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // MongoDB _id를 id로 변환
        const formattedFacilities = facilities.map(f => ({
            ...f,
            id: f._id.toString(),
            createdAt: f.createdAt?.toISOString(),
            updatedAt: f.updatedAt?.toISOString()
        }));

        res.json(formattedFacilities);
    } catch (error) {
        console.error('시설 목록 조회 오류:', error);
        res.status(500).json({ error: '시설 목록을 불러오는데 실패했습니다' });
    }
});

// GET /api/facilities/:id - 단일 시설 조회 (공개)
router.get('/:id', async (req, res) => {
    try {
        const facility = await Facility.findById(req.params.id).lean();

        if (!facility) {
            return res.status(404).json({ error: '시설을 찾을 수 없습니다' });
        }

        res.json({
            ...facility,
            id: facility._id.toString(),
            createdAt: facility.createdAt?.toISOString(),
            updatedAt: facility.updatedAt?.toISOString()
        });
    } catch (error) {
        console.error('시설 조회 오류:', error);
        res.status(500).json({ error: '시설 정보를 불러오는데 실패했습니다' });
    }
});

// POST /api/facilities - 시설 등록 (로그인 필수)
router.post('/', auth, async (req, res) => {
    try {
        const {
            name,
            address,
            category,
            price_daily,
            price_monthly,
            price_yearly,
            description,
            features,
            images
        } = req.body;

        const facility = new Facility({
            name,
            address,
            category,
            price_daily,
            price_monthly,
            price_yearly,
            description,
            features: features || [],
            images: images || [],
            owner: req.user._id // 현재 로그인한 사용자를 소유자로 설정
        });

        const saved = await facility.save();

        res.status(201).json({
            ...saved.toObject(),
            id: saved._id.toString(),
            createdAt: saved.createdAt?.toISOString(),
            updatedAt: saved.updatedAt?.toISOString()
        });
    } catch (error) {
        console.error('시설 등록 오류:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: '시설 등록에 실패했습니다' });
    }
});

// PUT /api/facilities/:id - 시설 수정 (소유자만 가능)
router.put('/:id', auth, async (req, res) => {
    try {
        const {
            name,
            address,
            category,
            price_daily,
            price_monthly,
            price_yearly,
            description,
            features,
            images
        } = req.body;

        // 먼저 시설을 찾아서 소유자 확인
        const existingFacility = await Facility.findById(req.params.id);
        if (!existingFacility) {
            return res.status(404).json({ error: '시설을 찾을 수 없습니다' });
        }

        if (existingFacility.owner && existingFacility.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: '수정 권한이 없습니다' });
        }

        const facility = await Facility.findByIdAndUpdate(
            req.params.id,
            {
                name,
                address,
                category,
                price_daily,
                price_monthly,
                price_yearly,
                description,
                features: features || [],
                images: images || []
            },
            { new: true, runValidators: true }
        ).lean();

        res.json({
            ...facility,
            id: facility._id.toString(),
            createdAt: facility.createdAt?.toISOString(),
            updatedAt: facility.updatedAt?.toISOString()
        });
    } catch (error) {
        console.error('시설 수정 오류:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: '시설 수정에 실패했습니다' });
    }
});

// DELETE /api/facilities/:id - 시설 삭제 (소유자만 가능)
router.delete('/:id', auth, async (req, res) => {
    try {
        // 먼저 시설을 찾아서 소유자 확인
        const existingFacility = await Facility.findById(req.params.id);
        if (!existingFacility) {
            return res.status(404).json({ error: '시설을 찾을 수 없습니다' });
        }

        if (existingFacility.owner && existingFacility.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: '삭제 권한이 없습니다' });
        }

        await Facility.findByIdAndDelete(req.params.id);

        res.json({ message: '시설이 삭제되었습니다', id: req.params.id });
    } catch (error) {
        console.error('시설 삭제 오류:', error);
        res.status(500).json({ error: '시설 삭제에 실패했습니다' });
    }
});

module.exports = router;
