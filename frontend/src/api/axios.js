import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost/api',
    headers: {
        'Accept': 'application/json',
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('ACCESS_TOKEN');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }


    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    return config;
});

export default api;