import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to handle errors uniformly
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.message || 'An unexpected network error occurred.';
        return Promise.reject(new Error(message));
    }
);

export async function register({ username, email, password }) {
    const response = await api.post('/api/auth/register', {
        username,
        email,
        password
    });
    return response.data;
}

export async function login({ email, password }) {
    const response = await api.post('/api/auth/login', {
        email,
        password
    });
    return response.data;
}

export async function logout() {
    const response = await api.post('/api/auth/logout');
    return response.data;
}

export async function getMe() {
    const response = await api.get('/api/auth/get-me');
    return response.data;
}

export default api;