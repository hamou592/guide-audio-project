// src/api.js
import axios from 'axios';

// Create an axios instance for API calls
const api = axios.create({
  baseURL: 'https://nasro.expedgs-audioguide.duckdns.org/api', // Your Laravel API base URL
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Add request interceptor to attach token and CSRF
api.interceptors.request.use(config => {
  // Attach XSRF token from cookies if present
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }

  // Attach Authorization header if user is logged in
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    if (userData.token) {
      config.headers['Authorization'] = `Bearer ${userData.token}`;
    }
  }

  return config;
});

// Add response interceptor for 401 errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper to get CSRF cookie
export const getCsrfCookie = async () => {
  try {
    await axios.get('https://nasro.expedgs-audioguide.duckdns.org/sanctum/csrf-cookie', { withCredentials: true });
    return true;
  } catch (error) {
    console.error('Failed to get CSRF cookie:', error);
    return false;
  }
};

export default api;