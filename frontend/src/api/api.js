import axios from 'axios';

// VITE_API_URL is the backend root (e.g. http://localhost:5000). We append /api here.
const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
});

// Attach the JWT (stored with the logged-in user) to every request.
api.interceptors.request.use((config) => {
    try {
        const stored = localStorage.getItem('user');
        if (stored) {
            const { token } = JSON.parse(stored);
            if (token) config.headers.Authorization = `Bearer ${token}`;
        }
    } catch {
        // Ignore corrupted storage; request just goes out unauthenticated.
    }
    return config;
});

export default api;