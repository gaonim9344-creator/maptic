import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// If API_BASE_URL is an absolute URL and doesn't end with /api, append it
if (API_BASE_URL.startsWith('http') && !API_BASE_URL.endsWith('/api')) {
    API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api';
}

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

// Facilities APIs
export const facilitiesAPI = {
    getAll: (params) => api.get('/facilities', { params }),
    getById: (id) => api.get(`/facilities/${id}`),
    getMy: () => api.get('/facilities/my'),
    create: (data) => api.post('/facilities', data),
    update: (id, data) => api.put(`/facilities/${id}`, data),
    delete: (id) => api.delete(`/facilities/${id}`)
};

export default api;
