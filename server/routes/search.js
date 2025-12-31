const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
    try {
        const { query, lat, lng, start } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const clientId = process.env.NAVER_SEARCH_CLIENT_ID || process.env.NAVER_API_KEY_ID;
        const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET || process.env.NAVER_API_KEY;

        if (!clientId || !clientSecret) {
            console.error('❌ NAVER Search API Keys are missing in environment variables');
            return res.status(401).json({
                error: 'API Keys missing',
                details: '서버 설정에 네이버 검색 API 키(NAVER_SEARCH_CLIENT_ID, NAVER_SEARCH_CLIENT_SECRET)가 없습니다.'
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
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret
            }
        });

        res.json(response.data);
    } catch (error) {
        const errorData = error.response?.data;
        console.error('Search API error:', errorData || error.message);

        let errorMessage = errorData?.errorMessage || errorData?.message || error.message;
        let guidance = null;

        if (error.response?.status === 401 || error.response?.status === 403) {
            errorMessage = '네이버 검색 API 인증 실패';
            guidance = '1. 클라우드타입 환경 변수(ID, Secret)에 오타나 공백이 없는지 확인하세요. 2. 네이버 개발자 센터 "API 설정"에서 프로젝트의 "웹 서비스 URL"을 정확히 등록했는지 확인하세요.';
            console.error('❌ Naver Auth Error Detail:', error.response.data);
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
