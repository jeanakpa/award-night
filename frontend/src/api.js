import axios from 'axios';

// In production builds (on Render CDN), always target the active backend API:
export const API_BASE_URL = import.meta.env.PROD
  ? 'https://award-backend-wnze.onrender.com/api'
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
