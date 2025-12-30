const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
    try {
        const { query, lat, lng, start } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        if (!process.env.NAVER_API_KEY_ID || !process.env.NAVER_API_KEY) {
            console.error('❌ NAVER API Keys are missing in .env');
            return res.status(401).json({
                error: 'API Keys missing',
                details: '서버 설정(.env)에 네이버 API 키가 없습니다. NAVER_API_KEY_ID와 NAVER_API_KEY를 설정해주세요.'
            });
        }

        // Naver Developers Center Search API (openapi.naver.com)
        const url = 'https://openapi.naver.com/v1/search/local.json';

        console.log(`Developers Center Search Request: ${query} (ID: ${process.env.NAVER_API_KEY_ID?.substring(0, 5)}...)`);

        const response = await axios.get(url, {
            params: {
                query: query,
                display: 100, // Maximize results per call
                start: start || 1, // Use passed start page or default to 1
                sort: 'random' // Sort by accuracy/relevance (better for distance) instead of reviews
            },
            headers: {
                'X-Naver-Client-Id': process.env.NAVER_API_KEY_ID,
                'X-Naver-Client-Secret': process.env.NAVER_API_KEY
            }
        });

        res.json(response.data);
    } catch (error) {
        const errorData = error.response?.data;
        console.error('Search API error:', errorData || error.message);

        let errorMessage = errorData?.errorMessage || errorData?.message || error.message;
        let guidance = null;

        if (error.response?.status === 401 || error.response?.status === 403) {
            errorMessage = 'Authentication Failed';
            guidance = '네이버 개발자 센터(developers.naver.com)에서 발급받은 Client ID와 Secret이 맞는지 확인해주세요. (NCP 키와는 다릅니다!)';
        } else if (error.response?.status === 404) {
            errorMessage = 'API Not Found';
            guidance = '검색 API URL이 올바르지 않거나, 개발자 센터에서 WEB 설정(http://localhost:3000)을 추가하지 않았을 수 있습니다.';
        }

        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch search results',
            details: errorMessage,
            guidance: guidance,
            status: error.response?.status
        });
    }
});

module.exports = router;

// Search route configured for Naver Developers Center
