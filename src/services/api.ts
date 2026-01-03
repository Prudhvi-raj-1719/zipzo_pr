import axios from 'axios';

// Pick backend URL from Vite env, fallback to localhost during dev
const ROOT_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Debug log (helps during deploy)
console.log('🔗 Using backend URL:', ROOT_URL);

// Axios instance with correct base path
const api = axios.create({
  baseURL: `${ROOT_URL}/api`,   // IMPORTANT: append /api here
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired/invalid token responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
