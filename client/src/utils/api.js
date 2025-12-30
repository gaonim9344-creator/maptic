import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth APIs
export const authAPI = {
    signup: (email, password) => api.post('/auth/signup', { email, password }),
    signin: (email, password) => api.post('/auth/signin', { email, password }),
    getMe: () => api.get('/auth/me')
};

// Preferences APIs
export const preferencesAPI = {
    get: () => api.get('/preferences'),
    update: (selectedSports) => api.put('/preferences', { selectedSports })
};

// Search APIs
export const searchAPI = {
    searchLocal: (query, lat, lng, start) => api.get('/search', { params: { query, lat, lng, start } })
};

export default api;
